import type { Context, Next } from "hono";
import { LessonService } from "../services/lesson.service.js";

export const LessonController = {
    // 📌 Tạo chủ đề
    createOrUpdate: async (c: Context, next: Next) => {
        const { _id, title, description, order, exercises, vocabularies, progress_id, status } = await c.req.json();
        const result = await LessonService.createOrUpdate(_id, title, description, order, exercises, vocabularies, progress_id, status);
        return c.json({ message: "Thực hiện thành công", data: result }, 200);
    },
    // 📌 Lấy chi tiết bài học
    getDetail: async (c: Context, next: Next) => {
        const { lesson_id } = c.req.param();
        const result = await LessonService.getDetail(lesson_id);
        return c.json({ message: "Lấy chi tiết bài học thành công", data: result }, 200);
    },
    // 📌 Get all lesson
    getAll: async (c: Context, next: Next) => {
        // Lấy query params với giá trị mặc định
        const page = Number(c.req.query("page")) || 1;
        const limit = Number(c.req.query("limit")) || 10;
        const search = c.req.query("search") || "";
        // Gọi service để lấy dữ liệu
        const lessons = await LessonService.getAll(page, limit, search);
        return c.json({ message: "Lấy danh sách bài học thành công", data: lessons }, 200);
    },
    // 📌 Xóa bài học
    deleteLesson: async (c: Context, next: Next) => {
        const { lesson_id } = c.req.param();
        const result = await LessonService.deleteLesson(lesson_id);
        return c.json({ message: "Xóa bài học thành công", data: result}, 200);
    },
    // import lesson
    importLesson: async (c: Context, next: Next) => {
        const body = await c.req.parseBody();
        const file = body["file"];
        const result = await LessonService.importLesson(file);
        return c.json({ message: "Import bài học thành công", data: result }, 200);
    },
};
