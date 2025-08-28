import { HTTPException } from "hono/http-exception";
import { getInfoData } from "../utils/index.js";
import UserProgressModel, { type IUserProgress } from "../models/user_progress.model.js";

export const UserProgressService = {
    // 📌 Create or Update user progress khi user thay đổi chủ đề học tập
    processDB: async (
        {
            user_id, progress_id, lesson_id, topic_id, status, score, detail, _id
        }: {
            user_id: string, lesson_id?: string | null, status?: string,
            progress_id?: string | null, topic_id: string | null, score: number, detail?: [], _id?: string
        }
    ) => {
        // Cập nhật hoặc tạo mới nếu `_id` không tồn tại
        let newUserProgress = null;
        if (!_id) {
            newUserProgress = await UserProgressModel.create({
                user_id, progress_id, lesson_id, status, score, detail, topic_id
            });
        } else {
            newUserProgress = await UserProgressModel.findOneAndUpdate(
                { _id },
                { user_id, progress_id, lesson_id, status, score, detail, topic_id },
                { upsert: true, new: true }
            );
        }
        return (await newUserProgress.populate("lesson_id")).populate("progress_id");
    },
    // 📌 Get topic đã học by user_id
    // getTopicLearned: async (user_id: string) => {
    //     const result = await UserProgressModel.find({
    //         user_id, lesson_id: null, score: 0
    //     }).lean();
    //     return result;
    // },
    // 📌 Get user progress theo user_id, progress_id và status == in_progress
    getByUserTopicAndStatus: async (user_id: string, progress_id: string) => {
        const result = await UserProgressModel.findOne({
            user_id, progress_id, status: "in_progress"
        }).populate({
            path: "lesson_id",
            select: "_id title description order exercises vocabularies min_score"
        }).populate("progress_id").lean();
        // if (!result) throw new HTTPException(404, { message: "User progress not found" });
        return result;
    },
    // 📌 Get all by user and topic 
    getAllByUserAndTopic: async (user_id: string, topic_id: string) => {
        const result = await UserProgressModel.find({
            user_id, topic_id
        }).lean();
        return result;
    },
};