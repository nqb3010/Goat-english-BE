import { HTTPException } from "hono/http-exception";
import { getInfoData } from "../utils/index.js";
import type { IExam } from "../models/exam.model.js";
import ExamModel from "../models/exam.model.js";
import { ExerciseService } from "./exercise.service.js";
import { Types } from "mongoose";
import { promises } from "dns";
import { info } from "console";
import _ from "lodash";
import { uploadFileImg } from "../utils/upload.ultil.js";
import isBase64 from "is-base64";

export const ExamService = {
    createOrUpdate : async (
        _id: string | null, name: string, description: string | undefined, image: string | undefined, topic_id: string | undefined,
        exercises: { 
            _id: string, type: string, level: string, question: string, options: string[], 
            multiple_correct: boolean, correct_answer: string, audio: string, explain_answer: string,
            explain_answer_vn: string
        }[],
         total_questions: number, duration: number, status?: string
    ) => {
        let imageUrl = image;
        if(status && !["publish", "draft"].includes(status)) {
            throw new HTTPException(400, { message: "Trạng thái không hợp lệ" });
        }
        if (image && isBase64(image,  { allowMime: true })) {
                    // upload image to cloudinary
                    const res = await uploadFileImg(image, "goat-exam");
                    imageUrl = res.url;
                }
        const processExercises = async () => {
            return Promise.all(exercises.map(async (exercise) => {
                const newExercise = await ExerciseService.createOrUpdate(exercise);
                if (!newExercise) throw new HTTPException(400, { message: "Không thể tạo hoặc cập nhật bài tập" });
                return newExercise._id;
            }));
        };
        const [newExercises] = await Promise.all([processExercises()]);
        const examData = {
            name,
            description,
            image: imageUrl,
            topic_id: topic_id ? new Types.ObjectId(topic_id) : undefined,
            exercises: newExercises,
            total_questions,
            duration,
            status: status || "publish",
            is_delete: false
        }
        const exam = await ExamModel.findByIdAndUpdate(
            _id ? new Types.ObjectId(_id) : new Types.ObjectId(),
            examData,
            { new: true, upsert: true }
        );
        return exam;
    },
    getDetail: async (exam_id: string) => {
        const exam = await ExamModel.findById(exam_id).lean();
        if (!exam || exam.is_delete) {
            throw new HTTPException(404, { message: "Đề thi không tồn tại" });
        }
        const exercises = await Promise.all(exam.exercises.map(async (exerciseId) => {
            const exercise = await ExerciseService.getById(exerciseId);
            console.log(exercise);
            return getInfoData({
                data : exercise,
                fields: ["_id", "type", "level", "question", "options", "multiple_correct", "correct_answer", "audio", "explain_answer", "explain_answer_vn"]
            });
        }));
        return { ...getInfoData({data: exam, fields: ["_id", "name", "description", "topic_id", "image", "total_questions", "duration", "status"]}), exercises };
    },
    getAll: async (page = 1, limit = 10, search = '') => {
        const query: any = { is_delete: false };
        // Nếu có từ khóa tìm kiếm, tìm theo tiêu đề hoặc mô tả của topic
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } }, // Tìm trong name của exam
                { description: { $regex: search, $options: 'i' } }, // Tìm trong description của exam
            ];
        }
        // Tính toán số bản ghi bỏ qua
        const skip = (page - 1) * limit;
        // Truy vấn dữ liệu với populate, phân trang và tìm kiếm
        const exams = await ExamModel.find(query)
            .skip(skip) // Bỏ qua số lượng bản ghi tương ứng với trang
            .limit(limit) // Giới hạn số lượng bản ghi mỗi trang
            .sort({ createdAt: -1 }); // Sắp xếp mới nhất trước
        // Lấy tổng số lượng bản ghi (phục vụ cho tổng số trang)
        const totalRecords = await ExamModel.countDocuments(query);
        const totalPages = Math.ceil(totalRecords / limit);
        return {
            exams,
            pagination: {
                currentPage: page,
                totalPages,
                totalRecords,
            },
        };
    },
    getByTopicId: async (topic_id: string) => {
        const exams = await ExamModel.find({ topic_id, is_delete: false }).populate("topic_id").sort({ order: 1 }).lean();
        return exams.map(exam => getInfoData({ data: exam, fields: ["_id", "name", "description", "image", "total_questions", "duration", "status"] }));
    },
}