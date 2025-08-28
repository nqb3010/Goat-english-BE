import type { Context, Next } from "hono";
import { ExerciseLevelService } from "../services/exercise_level.service.js";

export const ExerciseLevelController = {
    // 📌 Tạo ExerciseLevel
    create: async (c: Context, next: Next) => {
        const { ma_muc, ten_muc } = await c.req.json();
        const result = await ExerciseLevelService.create(ma_muc, ten_muc);
        return c.json({ message: "Tạo mới cấp độ bài tập thành công", data: result }, 201);
    },
    getAll: async (c: Context, next: Next) => {
        const result = await ExerciseLevelService.getAll();
        return c.json({ message: "Lấy danh sách cấp độ bài tập thành công", data: result }, 200);
    },
};
