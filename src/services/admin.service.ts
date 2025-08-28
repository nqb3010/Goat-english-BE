import { HTTPException } from "hono/http-exception";
import { getInfoData } from "../utils/index.js";
import UserModel from "../models/user.model.js";
import LessonModel from "../models/lesson.model.js";
import TopicModel from "../models/topic.model.js";
import VocabularyModel from "../models/vocabulary.model.js";
import UserProgressModel from "../models/user_progress.model.js";

export const AdminService = {
    // 📌 get data
    getData: async () => {
        // get count user
        const countUser = await UserModel.countDocuments({ is_delete: false });
        // get count lesson
        const countLesson = await LessonModel.countDocuments({ is_delete: false });
        // get count topic
        const countTopic = await TopicModel.countDocuments({ isDelete: false });
        // get count vocabulary
        const countVocabulary = await VocabularyModel.countDocuments({ is_delete: false });
        // get 10 lesson mới nhất
        const lessons = await LessonModel.find({ is_delete: false })
            .populate({
                path: "progress_id",
                select: "topic_id", // Chỉ lấy topic_id trong progress
                populate: {
                    path: "topic_id",
                    select: "name", // Chỉ lấy title trong topic
                },
            })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();
        // get 10 user mới nhất
        const users = await UserModel.find({ is_delete: false }).sort({ createdAt: -1 }).limit(10);
        return {
            countUser,
            countLesson,
            countTopic,
            countVocabulary,
            lessons: getInfoData({ data: lessons, fields: ["_id", "title", "status", "progress_id"] }),
            users: getInfoData({ data: users, fields: ["_id", "username", "email", "role"] }),
        }
    },
    // 📌 get report
    getReport: async () => {
        // Tổng số học viên (số lượng user duy nhất)
        const totalUsers = (await UserProgressModel.distinct("user_id")).length;
        // Tổng số bài học đã có tiến trình
        const totalLessons = (await UserProgressModel.distinct("lesson_id")).length;
        // Tính tỷ lệ hoàn thành bài học
        const completedLessons = await UserProgressModel.countDocuments({ status: "completed" });
        const inProgressLessons = await UserProgressModel.countDocuments({ status: "in_progress" });
        const completionRate = {
            completed: completedLessons,
            inProgress: inProgressLessons,
        };
        // Điểm trung bình của học viên
        const avgScoreData = await UserProgressModel.aggregate([
            { $group: { _id: null, avgScore: { $avg: "$score" } } }
        ]);
        const avgScore = avgScoreData.length > 0 ? avgScoreData[0].avgScore : 0;
        // Bài học phổ biến nhất (bài học có nhiều người tham gia nhất)
        const topLessons = await UserProgressModel.aggregate([
            {
                $group: {
                    _id: "$lesson_id",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }, // Giới hạn số lượng bài học phổ biến nhất
            {
                $lookup: {
                    from: "lessons",  // Tên collection của LessonModel
                    localField: "_id", // _id của group chính là lesson_id
                    foreignField: "_id", // Khớp với _id của bài học
                    as: "lessonInfo"
                }
            },
            {
                $unwind: "$lessonInfo" // Giải nén mảng lessonInfo
            },
            {
                $project: {
                    _id: 1,
                    count: 1,
                    title: "$lessonInfo.title", // Lấy tên bài học
                    progress_id: "$lessonInfo.progress_id" // Lấy lộ trình bài học
                }
            }
        ]);        
        return {
            totalUsers,
            totalLessons,
            completionRate,
            avgScore,
            topLessons,
        }
    },
};