import { HTTPException } from "hono/http-exception";
import TopicModel, { type ITopic } from "../models/topic.model.js";
import { getInfoData } from "../utils/index.js";
import { uploadFileImg } from "../utils/upload.ultil.js";
import isBase64 from "is-base64";

export const TopicService = {
    // 📌 Tạo mới chủ đề
    createOrUpdate: async (_id: string | null, name: string, description: string, image?: string) => {
        let imageUrl = image;
        // Nếu là base64 mới upload
        if (image && isBase64(image,  { allowMime: true })) {
            // upload image to cloudinary
            const res = await uploadFileImg(image, "goat-topic");
            imageUrl = res.url;
        }
        // Cập nhật hoặc tạo mới nếu `_id` không tồn tại
        let updatedTopic = null;
        if (!_id) {
            // Kiểm tra xem chủ đề đã tồn tại chưa
            const existingTopic = await TopicModel.findOne({ name, isDelete: false });
            if (existingTopic) {
                throw new HTTPException(400, { message: "Chủ đề đã tồn tại" });
            }
            // Tạo mới chủ đề
            updatedTopic = await TopicModel.create({
                name,
                description,
                image: imageUrl
            });
        } else {
            updatedTopic = await TopicModel.findOneAndUpdate(
                { _id }, 
                { name, description, image: imageUrl }, 
                { upsert: true, new: true } 
            );
        }
        return updatedTopic;
    },  
    // 📌 Get user by id
    getById: async (topic_id: string) => {
        const topic = await TopicModel.findOne({ _id: topic_id, isDelete: false }).lean();
        if (!topic) throw new HTTPException(404, { message: "Chủ đề không tồn tại" });
        return getInfoData({ fields: ["_id", "name", "description", "image"], data: topic });
    },
    getAll: async (page: number, limit: number, search: string) => {
        let query: any = { isDelete: false };
        if (search) {
            query.name = { $regex: search, $options: "i" };
        }
        const skip = (page - 1) * limit;
        const topics = await TopicModel.find(query).skip(skip).limit(limit).lean();
        const totalRecords = await TopicModel.countDocuments(query);
        const totalPages = Math.ceil(totalRecords / limit);
        return {
            topics,
            pagination: {
                currentPage: page,
                totalPages,
                totalRecords,
            },
        };
    },
    deleteById: async (topic_id: string) => {
        const topic = await TopicModel.findOne({ _id: topic_id, isDelete: false });
        if (!topic) throw new HTTPException(404, { message: "Chủ đề không tồn tại" });
        topic.isDelete = true;
        return await topic.save();
    },
    getTopicIdByName: async (name: string) => {
        const topic = await TopicModel.findOne({ name: { $regex: name, $options: 'i' }, isDelete: false });
        if (!topic) throw new HTTPException(404, { message: "Chủ đề không tồn tại" }); 
        return topic._id;
    }
};