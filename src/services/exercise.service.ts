import { HTTPException } from "hono/http-exception";
import { getInfoData } from "../utils/index.js";
import type { IExercise } from "../models/exercise.model.js";
import ExerciseModel from "../models/exercise.model.js";
import { ExerciseTypeService } from "./exercise_type.service.js";
import { ExerciseLevelService } from "./exercise_level.service.js";
import { Types } from "mongoose";

export const ExerciseService = {
    // 📌 Tạo mới
    createOrUpdate: async (
        { 
            _id, type, level, question, options, multiple_correct, correct_answer, audio, explain_answer, explain_answer_vn
        }:
        {
            _id: string, type: string, level: string, question: string,
            options?: string[], multiple_correct?: boolean,
            correct_answer?: string | string[], audio?: string,
            explain_answer?: string, explain_answer_vn?: string
        }
    ) => {
        // xử lý _id có thể là "0", "1",... nếu tạo mới, hoặc là id của bài tập nếu cập nhật
        const isCreate = Types.ObjectId.isValid(_id) ? false : true;
        const newId = isCreate ? undefined : _id;
        // Kiểm tra xem bài tập đã tồn tại chưa
        const exercise = await ExerciseModel.findById(newId);
        // Nếu tồn tại thì cập nhật
        if (exercise) {
            return await ExerciseModel.findByIdAndUpdate(
                newId,
                { type, level, question, options, multiple_correct, correct_answer, audio, explain_answer, explain_answer_vn },
                { new: true }
            );
        } else {
            // Nếu không tồn tại thì tạo mới
            const newExercise = new ExerciseModel(
                { 
                    type, level, question, options, multiple_correct, 
                    correct_answer, audio, explain_answer, explain_answer_vn 
                }
            );
            return await newExercise.save();
        }
    },
    getById: async (exercise_id: string) => {
        const exercise = await ExerciseModel.findById(exercise_id).populate("type").populate("level").lean();
        if (!exercise) throw new HTTPException(404, { message: "Không tìm thấy bài tập" });
        return exercise;
    }
};