import type { Context, Next } from "hono";
import { VoCabularyService } from "../services/vocabulary.service.js";

export const VocabularyController = {
    createOrUpdate: async (c: Context, next: Next) => {
        const { _id, word, meaning, phonetic, type, topic_id, examples, audio, vietnamese } = await c.req.json();
        const result = await VoCabularyService.createOrUpdate(_id, word, meaning, phonetic, type, topic_id, examples, audio, vietnamese);
        return c.json({ message: "Thực hiện thành công", data: result }, 200);
    },
    getAll: async (c: Context, next: Next) => {
        // Lấy query params với giá trị mặc định
        const page = Number(c.req.query("page")) || 1;
        const limit = Number(c.req.query("limit")) || 10;
        const search = c.req.query("search") || "";
        const result = await VoCabularyService.getAll(page, limit, search);
        return c.json({ message: "Lấy danh sách từ vựng thành công", data: result }, 200);
    },
    getById: async (c: Context, next: Next) => {
        const { vocabulary_id } = c.req.param();;
        const result = await VoCabularyService.getById(vocabulary_id);
        return c.json({ message: "Lấy thông tin từ vựng thành công", data: result }, 200);
    },
    deleteById: async (c: Context, next: Next) => {
        const { vocabulary_id } = c.req.param();
        const result = await VoCabularyService.deleteById(vocabulary_id);
        return c.json({ message: "Xóa từ vựng thành công", data: result }, 200);
    },
    getAllByTopic: async (c: Context, next: Next) => {
        const { topic_id } = c.req.param();
        const { page, limit, search, sort } = c.req.query();
        const result = await VoCabularyService.getAllByTopic(topic_id, Number(page) || 1, Number(limit) || 10, search, sort);
        return c.json({ message: "Lấy danh sách từ vựng theo chủ đề thành công", data: result }, 200);
    }
};
