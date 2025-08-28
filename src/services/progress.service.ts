import { HTTPException } from "hono/http-exception";
import ProgressModel, { type IProgress } from "../models/progress.model.js";
import { getInfoData } from "../utils/index.js";
import { LessonService } from "./lesson.service.js";
import TopicModel from "../models/topic.model.js";

export const ProgressService = {
    // 📌 Tạo mới chủ đề
    createOrUpdate: async (_id: string | null, name: string, description: string, topic_id: string, icon?: string, order?: number) => {
        // check exist
        if (!_id) {
            const checkProgress = await ProgressModel.findOne({ is_delete: false, topic_id, name: { $regex: name, $options: 'i' }});
            if (checkProgress) throw new HTTPException(404, { message: "Lộ trình đã tồn tại" });
        }
        // Cập nhật hoặc tạo mới nếu `_id` không tồn tại
        let updatedProgress;
        if (!_id) {
            updatedProgress = await ProgressModel.create({
                name, description, icon, order, topic_id
            });
        } else {
            updatedProgress = await ProgressModel.findOneAndUpdate(
                { _id }, 
                { name, description, icon, order, topic_id }, 
                { upsert: true, new: true } 
            );
        }
        return updatedProgress;
    },
    // 📌 Get all progress by topic
    getAllByTopic: async (topic_id: string) => {
        const progresses = await ProgressModel.find({ topic_id, is_delete: false })
            .populate("topic_id")
            .sort({ order: 1 })
            .lean();
        if (!progresses.length) return [];
        // Lấy tất cả lessons cho mỗi progress
        const progressesWithLessons = await Promise.all(
            progresses.map(async (progress) => {
                const lessons = await LessonService.getByProgressId(progress._id.toString());
                return {
                    _id: progress._id,
                    name: progress.name,
                    description: progress.description,
                    icon: progress.icon,
                    order: progress.order,
                    topic_id: progress.topic_id,
                    lessons,
                };
            })
        );
        return progressesWithLessons;
    },
    // 📌 Get progress đầu tiên của chủ đề
    getFirstByTopic: async (topic_id: string) => {
        // const progress = await ProgressModel.findOne({ topic_id, is_delete: false }).lean();
        const progress = await ProgressModel.findOne({
            topic_id,
            is_delete: false
        }).sort({ createdAt: 1 }).lean();
        if (!progress) throw new HTTPException(404, { message: "Không tìm thấy lộ trình" });
        return progress;
    },
    // 📌 Get progress by topic id và thứ tự order
    getByTopicIdAndOrder: async (topic_id: string, order: number) => {
        const progress = await ProgressModel.findOne({ topic_id, order, is_delete: false }).lean();
        if (!progress) throw new HTTPException(404, { message: "Không tìm thấy lộ trình" });
        return progress;
    },
    // 📌 Get all progress
    getAll: async (page = 1, limit = 10, search = '') => {
        const query: any = { is_delete: false };
        // Nếu có từ khóa tìm kiếm, tìm theo tiêu đề hoặc mô tả của topic
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } }, // Tìm trong name của progress
                { description: { $regex: search, $options: 'i' } }, // Tìm trong description của progress
                { topic_id: { $in: await TopicModel.find({ name: { $regex: search, $options: 'i' } }).distinct('_id') } } // Tìm theo topic name
            ];
        }
        // Tính toán số bản ghi bỏ qua
        const skip = (page - 1) * limit;
        // Truy vấn dữ liệu với populate, phân trang và tìm kiếm
        const progresses = await ProgressModel.find(query)
            .populate({
                path: "topic_id",
                select: "name description"
            })
            .skip(skip) // Bỏ qua số lượng bản ghi tương ứng với trang
            .limit(limit) // Giới hạn số lượng bản ghi mỗi trang
            .sort({ createdAt: -1 }); // Sắp xếp mới nhất trước
        const totalRecords = await ProgressModel.countDocuments(query);
        const totalPages = Math.ceil(totalRecords / limit);
        return {
            progresses,
            pagination: {
                currentPage: page,
                totalPages,
                totalRecords,
            },
        };
    },
    deleteById: async (progress_id: string) => {
        const progress = await ProgressModel.findOne({ _id: progress_id, is_delete: false });
        if (!progress) throw new HTTPException(404, { message: "Lộ trình không tồn tại" });
        progress.is_delete = true;
        return await progress.save();
    },
    getById: async (progress_id: string) => {
        const progress = await ProgressModel.findOne({ _id: progress_id, is_delete: false });
        if (!progress) throw new HTTPException(404, { message: "Lộ trình không tồn tại" });
        return progress;
    },
    getNextByTopic: async (topic_id: string, progress_id: string) => {
        const progress = await ProgressModel.findOne({ _id: progress_id, is_delete: false });
        if (!progress) throw new HTTPException(404, { message: "Lộ trình không tồn tại" });
        const nextProgress = await ProgressModel.findOne({ topic_id, order: { $gt: progress.order }, is_delete: false }).sort({ order: 1 });
        if (!nextProgress) throw new HTTPException(404, { message: "Không tìm thấy lộ trình kế tiếp" });
        return nextProgress;
    },
    getProgressIdByNameAndTopic: async (name: string, topic_id?: string) => {
        const progress = await ProgressModel.findOne({ name: { $regex: `^${name}$`, $options: 'i' }, topic_id, is_delete: false });
        if (!progress) throw new HTTPException(404, { message: "Lộ trình không tồn tại" });
        return progress._id;
    },
};