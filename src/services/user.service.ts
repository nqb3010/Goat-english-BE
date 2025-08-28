import { HTTPException } from "hono/http-exception";
import { getInfoData } from "../utils/index.js";
import UserModel from "../models/user.model.js";
import { Types } from "mongoose";
import { TopicService } from "./topic.service.js";
import { UserProgressService } from "./user_progress.service.js";
import { LessonService } from "./lesson.service.js";
import { ProgressService } from "./progress.service.js";
import _ from "lodash";
import { UserTopicService } from "./user_topic.service.js";
import UserProgressModel from "../models/user_progress.model.js";
import { ExerciseService } from "./exercise.service.js";
import { AuthService } from "./auth.service.js";
import bcrypt from "bcryptjs";

const otpStore = new Map<string, { otp: string, expiresAt: number }>(); // Lưu OTP tạm thời

export const UserService = {
    // 📌 Tạo mới user
    createOrUpdate: async (_id: string | null, username: string, email: string, role: string) => {
        // Cập nhật hoặc tạo mới nếu `_id` không tồn tại
        let updatedUser;
        if (!_id) {
            updatedUser = await UserModel.create({
                username, email, role
            });
        } else {
            updatedUser = await UserModel.findOneAndUpdate(
                { _id }, 
                { username, email, role }, 
                { upsert: true, new: true } 
            );
        }
        return updatedUser;
    },
    // 📌 Get all user
    getAll: async (page = 1, limit = 10, search: string) => {
        let query: any = { is_delete: false };
        if (search) {
            query.$or = [
                { username: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ];
        }
        const skip = (page - 1) * limit;
        const users = await UserModel.find(query).skip(skip).limit(limit).lean();
        const totalRecords = await UserModel.countDocuments(query);
        const totalPages = Math.ceil(totalRecords / limit);
        return {
            users: getInfoData({ fields: ["_id", "username", "email", "topic_id", "role"], data: users }),
            pagination: {
                currentPage: page,
                totalPages,
                totalRecords,
            },
        };
        // return getInfoData({ fields: ["_id", "username", "email", "topic_id", "role"], data: users });
    },
    // 📌 Get user by id
    getById: async (user_id: string) => {
        const user = await UserModel.findById(user_id).lean();
        if (!user) throw new HTTPException(404, { message: "User not found" });
        return getInfoData({ fields: ["_id", "username", "email", "topic_id", "role"], data: user });
    },
    // 📌 Get info user
    getInfo: async (user_id: string) => {
        const user = await UserModel.findOne({ _id: user_id, is_delete: false }).lean();
        if (!user) throw new HTTPException(404, { message: "User not found" });
        // get topic and score
        let score = 0;
        let topic = null;
        if (user.topic_id) {
            topic = await TopicService.getById(user.topic_id?.toString());
            // get score user
            const userProgresses = await UserProgressService.getAllByUserAndTopic(user._id?.toString(), user.topic_id?.toString());
            score = _.sumBy(userProgresses, "score");
        }
        return {
            user: getInfoData({ fields: ["_id", "username", "email", "role", "topic_id", "streak", "streak_max", "streak_start"], data: user }),
            topic, score
        };
    },
    // 📌 Change topic user
    changeTopic: async (user_id: string, topic_id: string, type: string) => {
        // check user
        const user = await UserModel.findById(user_id);
        if (!user) throw new HTTPException(404, { message: "Người dùng không tồn tại" });
        // check topic
        const topic = await TopicService.getById(topic_id);
        // update topic
        user.topic_id = new Types.ObjectId(topic_id);
        await user.save();
        // nếu bắt đầu chủ để mới thì update
        if (type === "start") {
            // update user topic
            const newUserTopic = await UserTopicService.processDB({ user_id, topic_id });
            // update user progress first
            const newUserProgress = await UserProgressService.processDB({
                user_id, status: "in_progress", score: 0, lesson_id: null, progress_id: null, topic_id
            });
            return { user: getInfoData({ fields: ["_id", "username", "email", "topic_id"], data: user }), newUserTopic, newUserProgress };
        }
        return getInfoData({ fields: ["_id", "username", "email", "topic_id"], data: user });
    },
    // 📌 Get topics đã học
    getTopicsLearned: async (user_id: string) => {
        const topicsLearned = await UserTopicService.getByUser(user_id);
        return topicsLearned;
    },
    // 📌 Get lesson hiện tại cần học
    getLessonCurrent: async (user_id: string, topic_id: string) => {
        // Tìm tiến trình học của user
        const userProgress = await UserProgressModel.findOne({ user_id, topic_id, status: "in_progress" })
            .populate("lesson_id").populate("progress_id").lean();
        // Nếu chưa có tiến trình học thì tạo mới
        if (!userProgress) {
            // Lấy progress đầu tiên của chủ đề
            const firstProgress = await ProgressService.getFirstByTopic(topic_id);
            // Lấy bài học đầu tiên của progress
            const lesson: any = await LessonService.getFirstByProgress(firstProgress._id.toString());
            // update user progress
            const newUserProgress = await UserProgressService.processDB({
                user_id, status: "in_progress", score: 0, lesson_id: lesson._id.toString(),
                progress_id: firstProgress._id.toString(), topic_id
            });
            return newUserProgress;
        }
        return userProgress;
    },
    // 📌 submit lesson
    submitLesson: async (
        { user_id, lesson_id, topic_id, progress_id, status = "completed", score = 50, detail }:
        { user_id: string, lesson_id: string, topic_id: string, progress_id: string, status: string, score: number, detail: []}
    ) => {
        const userProgress: any = await UserProgressModel.findOne({ user_id, lesson_id, topic_id, progress_id });
        if (!userProgress) throw new HTTPException(404, { message: "Không tìm thấy bài học" });
        // update streak nếu hoàn thành bài học đầu tiên trong ngày
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkTodayProgress = await UserProgressModel.findOne({
            user_id,
            status: "completed",
            createdAt: { $gte: today } // Chỉ lấy các bài học từ 00:00 hôm nay trở đi
        });
        if (!checkTodayProgress) {
            // Tăng streak + cập nhật ngày bắt đầu streak
            await UserModel.findByIdAndUpdate(user_id, {
                $inc: { streak: 1 },
                $set: { streak_start: new Date() }
            });
            // Lấy lại user sau khi update
            const updatedUser: any = await UserModel.findById(user_id);
            if (updatedUser.streak > (updatedUser.streak_max || 0)) {
                updatedUser.streak_max = updatedUser.streak;
                await updatedUser.save();
            }
        }
        // update
        const result = await UserProgressService.processDB({
            user_id, lesson_id, topic_id, progress_id, status, score, detail, _id: userProgress?._id?.toString()
        });
        if (!result) throw new HTTPException(400, { message: "Không thể cập nhật bài học" });
        // add lesson tiếp theo vào user progress
        // Lấy bài học tiếp theo từ danh sách bài học của progress
        const lessonsProgress = await LessonService.getByProgressId(progress_id);
        const lessonIndex = lessonsProgress.findIndex((lesson) => lesson._id.toString() === lesson_id);
        const nextLesson = lessonsProgress[lessonIndex + 1];
        if (nextLesson) {
            // update user progress
            await UserProgressService.processDB({
                user_id, status: "in_progress", score: 0, lesson_id: nextLesson._id.toString(),
                progress_id, topic_id
            });
        } else {
            // Nếu không có bài học tiếp theo thì chuyển sang progress tiếp theo của chủ đề
            const nextProgress: any = await ProgressService.getNextByTopic(topic_id, progress_id);
            if (nextProgress) {
                // Lấy bài học đầu tiên của progress
                const firstLesson: any = await LessonService.getFirstByProgress(nextProgress._id.toString());
                if (!firstLesson) throw new HTTPException(404, { message: "Không tìm thấy bài học" });
                // update user progress
                await UserProgressService.processDB({
                    user_id, status: "in_progress", score: 0, lesson_id: firstLesson._id.toString(),
                    progress_id: nextProgress._id.toString(), topic_id
                });
            }
        }
        return null;
    },
    deleteById: async (user_id: string) => {
        const user = await UserModel.findOne({ _id: user_id, is_delete: false });
        if (!user) throw new HTTPException(404, { message: "Người dùng không tồn tại" });
        user.is_delete = true;
        return await user.save();
    },
    getOldMistake: async (user_id: string, topic_id: string) => {
        const userProgresses = await UserProgressService.getAllByUserAndTopic(user_id, topic_id);
        // get exercise from detail of user progress
        let oldMistakes: any = [];
        // get detail exercise
        await Promise.all(userProgresses.map(async (progress) => {
            if (progress.detail) {
                await Promise.all(progress.detail.map(async (item) => {
                    if (item.correct === false) {
                        // get exercise by item.exercise_id
                        const exercise = await ExerciseService.getById(item.exercise_id);
                        oldMistakes.push({ ...item, exercise });
                    }
                }));
            }
        }));
        return oldMistakes;
    },
    // 📌 update infor user
    updateInfor: async (user_id: string, username: string, email: string, otpCode?: string) => {
        // check email đã tồn tại chưa
        const userEmail: any = await UserModel.findOne({ email, is_delete: false });
        if (userEmail && userEmail?._id?.toString() !== user_id) {
            throw new HTTPException(400, { message: "Email đã tồn tại" });
        }
        const userUsername: any = await UserModel.findOne({ username, is_delete: false });
        if (userUsername && userUsername?._id?.toString() !== user_id) {
            throw new HTTPException(400, { message: "Tên đăng nhập đã tồn tại" });
        }
        // check user tồn tại không
        const userUpdate = await UserModel.findById(user_id);
        if (!userUpdate) throw new HTTPException(404, { message: "Người dùng không tồn tại" });
        if (otpCode) {
            // check otpCode có đúng không
            const isValid = await AuthService.verifyOTP(email, otpCode, otpStore);
            if (!isValid) throw new HTTPException(400, { message: "Mã OTP không hợp lệ hoặc đã hết hạn!" });
            // update user
            userUpdate.username = username;
            userUpdate.email = email;
            await userUpdate.save();
            return {
                status: 200,
                message: "Cập nhật thông tin thành công",
                data: getInfoData({ fields: ["_id", "username", "email"], data: userUpdate })
            };
        }
        // send otp to email
        otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // OTP 6 chữ số
        const expiresAt = Date.now() + 5 * 60 * 1000; // Hết hạn sau 5 phút
        otpStore.set(email, { otp: otpCode, expiresAt });
        await AuthService.sendOTPMail({ emailTo: email, otpCode });
        return {
            status: 200,
            message: "Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra email để xác nhận thay đổi.",
            otpCode: true
        };
    },
    // 📌 Change password
    changePassword: async (user_id: string, oldPassword: string, newPassword: string) => {
        // check user tồn tại không
        const user: any = await UserModel.findById(user_id);
        if (!user) throw new HTTPException(404, { message: "Người dùng không tồn tại" });
        // check password đúng không
        const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
        if (!isMatch) throw new HTTPException(400, { message: "Mật khẩu cũ không đúng" });
        // check mật khẩu mới có giống mật khẩu cũ không
        if (oldPassword === newPassword) throw new HTTPException(400, { message: "Mật khẩu mới không được giống mật khẩu cũ" });
        // update
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password_hash = hashedPassword;
        await user.save();
        return getInfoData({ fields: ["_id", "username", "email"], data: user });
    },
    // 📌 Delete account
    deleteAccount: async (user_id: string, password: string) => {
        const user = await UserModel.findById(user_id);
        if (!user) throw new HTTPException(404, { message: "Người dùng không tồn tại" });
        // check password đúng không
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) throw new HTTPException(400, { message: "Mật khẩu không đúng" });
        // xóa tài khoản
        user.is_delete = true;
        return await user.save();
    },
    checkStreak: async (user_id: string) => {
        // Lấy thông tin người dùng
        const user: any = await UserModel.findById(user_id).lean();
        if (!user) throw new HTTPException(404, { message: "Người dùng không tồn tại" });
        if (!user.streak_start) {
            // Nếu không có ngày bắt đầu streak, trả về thông báo
            return {
                status: 200,
                message: "Chưa có streak nào",
                streak: 0,
                reset_streak: false
            };
        }
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // Kiểm tra xem người dùng có học vào ngày hôm nay không
        const checkTodayProgress = await UserProgressModel.findOne({
            user_id: user._id,
            status: "completed",
            createdAt: { $gte: today } // Chỉ xét bài học trong ngày hôm nay
        });
        if (checkTodayProgress) {
            // Nếu có bài học nào vào ngày hôm nay, trả về thông báo
            return {
                status: 200,
                message: "Người dùng đã học bài hôm nay",
                streak: user.streak,
                reset_streak: false
            };
        }
        // Kiểm tra xem người dùng có học vào ngày hôm qua không
        const checkYesterdayProgress = await UserProgressModel.findOne({
            user_id: user._id,
            status: "completed",
            createdAt: { $gte: yesterday, $lt: today } // Chỉ xét bài học trong ngày hôm qua
        });
        if (!checkYesterdayProgress) {
            // Nếu không có bài học nào vào ngày hôm qua, reset streak về 0
            const result = await UserModel.findByIdAndUpdate(user_id, { $set: { streak: 0 } });
            return {
                status: 200,
                message: "Không có bài học nào vào ngày hôm qua, streak đã được reset về 0",
                streak: 0,
                result,
                reset_streak: true
            };
        }
        return {
            status: 200,
            message: "Kiểm tra streak thành công",
            streak: user.streak,
            reset_streak: false
        }
    }
};