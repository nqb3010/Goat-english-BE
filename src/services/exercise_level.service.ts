import { HTTPException } from "hono/http-exception";
import { getInfoData } from "../utils/index.js";
import type { IExerciseLevel } from "../models/exercise_level.model.js";
import ExerciseLevelModel from "../models/exercise_level.model.js";

export const ExerciseLevelService = {
    // 📌 Tạo mới
    create: async (ma_muc: string, ten_muc: string) => {
        const newItem: IExerciseLevel = new ExerciseLevelModel({
            ma_muc, ten_muc
        });
        return await newItem.save();
    },
    // 📌 Get by id
    getById: async (id: string) => {
        const data = await ExerciseLevelModel.findById(id).lean();
        if (!data) throw new HTTPException(404, { message: "Không tìm thấy cấp độ bài tập" });
        return {
            level_id: data._id,
            level_ma_muc: data.ma_muc,
            level_ten_muc: data.ten_muc
        };
    },
    getAll: async () => {
        const data = await ExerciseLevelModel.find().lean();
        return data;
    },
    getLevelIdByName: async (ten_muc: string) => {
        const data = await ExerciseLevelModel.findOne({ ten_muc: { $regex: ten_muc, $options: 'i' } }).lean();
        if (!data) throw new HTTPException(404, { message: "Không tìm thấy cấp độ bài tập" });
        return data._id; 
    }
};