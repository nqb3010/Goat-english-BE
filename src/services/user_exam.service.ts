import UserExamModel from "../models/user_exam.model.js"

export const UserExamService = {
    getHistoryByUser: async (user_id: string) => {
        const result = await UserExamModel.find({ user_id }).populate("exam_id").populate("topic_id").lean();
        return result;
    }
}