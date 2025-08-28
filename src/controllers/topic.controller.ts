import type { Context } from "hono";
import { TopicService } from "../services/topic.service.js";

export const TopicController = {
    // 📌 Tạo chủ đề
    createOrUpdate: async (c: Context) => {
        const { _id, name, description, image } = await c.req.json();
        const result = await TopicService.createOrUpdate(_id, name, description, image);
        return c.json({ message: "Thực hiện thành công", data: result }, 200);
    },
    getAll: async (c: Context) => {
        const page = Number(c.req.query("page")) || 1;
        const limit = Number(c.req.query("limit")) || 10;
        const search = c.req.query("search") || "";
        const topics = await TopicService.getAll(page, limit, search);
        return c.json({ message: "Lấy danh sách chủ đề thành công", data: topics }, 200);
    },
    getById: async (c: Context) => {
        const { topic_id } = c.req.param();
        const topic = await TopicService.getById(topic_id);
        return c.json({ message: "Success", data: topic }, 200);
    },
    deleteById: async (c: Context) => {
        const { topic_id } = c.req.param();
        const result = await TopicService.deleteById(topic_id);
        return c.json({ message: "Xóa chủ đề thành công", data: result }, 200);
    },
};
