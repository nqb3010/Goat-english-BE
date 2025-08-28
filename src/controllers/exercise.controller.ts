import type { Context, Next } from "hono";
import { ExerciseService } from "../services/exercise.service.js";

export const ExerciseController = {
    // 📌 Tạo Exercise
    create: async (c: Context, next: Next) => {
        const { 
            type, level, question, options, multiple_correct, _id,
            correct_answer, audio, explain_answer, explain_answer_vn
        } = await c.req.json();
        const result = await ExerciseService.createOrUpdate({
            _id, type, level, question, options, multiple_correct, correct_answer, audio, explain_answer, explain_answer_vn
        });
        return c.json({ message: "Tạo mới bài tập thành công", data: result }, 201);
    }
};
