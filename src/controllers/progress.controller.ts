import type { Context, Next } from "hono";
import { ProgressService } from "../services/progress.service.js";

export const ProgressController = {
    // 📌 Tạo chủ đề
    createOrUpdate: async (c: Context, next: Next) => {
        const { _id, name, description, icon, order, topic_id } = await c.req.json();
        const result = await ProgressService.createOrUpdate(_id, name, description, topic_id, icon, order);
        return c.json({ message: "Thực hiện thành công", data: result }, 200);
    },
    // 📌 Get all progress by topic
    getAllByTopic: async (c: Context, next: Next) => {
        const { topic_id } = c.req.param();
        const progresses = await ProgressService.getAllByTopic(topic_id);
        return c.json({ message: "Lấy danh sách progress thành công", data: progresses }, 200);
    },
    // 📌 Get all progress
    getAll: async (c: Context, next: Next) => {
        // Lấy query params với giá trị mặc định
        const page = Number(c.req.query("page")) || 1;
        const limit = Number(c.req.query("limit")) || 10;
        const search = c.req.query("search") || "";
        // Gọi service để lấy dữ liệu
        const progresses = await ProgressService.getAll(page, limit, search);
        return c.json({ message: "Lấy danh sách progress thành công", data: progresses }, 200);
    },
    deleteById: async (c: Context, next: Next) => {
        const { progress_id } = c.req.param();
        const result = await ProgressService.deleteById(progress_id);
        return c.json({ message: "Xóa lộ trình thành công", data: result }, 200);
    },
    getById: async (c: Context, next: Next) => {
        const { progress_id } = c.req.param();
        const result = await ProgressService.getById(progress_id);
        return c.json({ message: "Success", data: result }, 200);
    },
};
