import type { Context, Next } from "hono";
import { ExerciseTypeService } from "../services/exercise_type.service.js";

export const ExerciseTypeController = {
    // 📌 Tạo ExerciseType
    create: async (c: Context, next: Next) => {
        const { ma_muc, ten_muc } = await c.req.json();
        const result = await ExerciseTypeService.create(ma_muc, ten_muc);
        return c.json({ message: "Tạo mới loại bài tập thành công", data: result }, 201);
    },
    getAll: async (c: Context, next: Next) => {
        const result = await ExerciseTypeService.getAll();
        return c.json({ message: "Lấy danh sách loại bài tập thành công", data: result }, 200);
    },
};
