import { HTTPException } from "hono/http-exception";
import { getInfoData } from "../utils/index.js";
import UserTopicModel from "../models/user_topic.model.js";

export const UserTopicService = {
    // 📌 Create or Update
    processDB: async (
        {
            user_id, topic_id, _id
        }: {
            user_id: string, topic_id: string, _id?: string
        }
    ) => {
        // Cập nhật hoặc tạo mới nếu `_id` không tồn tại
        let updatedUserTopic = null;
        if (!_id) {
            updatedUserTopic = await UserTopicModel.create({
                user_id, topic_id
            });
        } else {
            updatedUserTopic = await UserTopicModel.findOneAndUpdate(
                { _id },
                { user_id, topic_id },
                { upsert: true, new: true }
            );
        }
        return updatedUserTopic;
    },
    // 📌 Get topic by user_id
    getByUser: async (user_id: string) => {
        const result = await UserTopicModel.find({ user_id }).lean();
        return result;
    },
};