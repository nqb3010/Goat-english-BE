import type { Context, Next } from "hono";
import { ExamService } from "../services/exam.service.js";

export const ExamController = {
    // 📌 Tạo hoặc cập nhật đề thi
    createOrUpdate: async (c: Context, next: Next) => {
        const { _id, name, description, image, topic_id, exercises, total_questions, duration, status } = await c.req.json();
        const result = await ExamService.createOrUpdate(_id, name, description, image, topic_id, exercises, total_questions, duration, status);
        return c.json({ message: "Thực hiện thành công", data: result }, 200);
    },
    // 📌 Lấy chi tiết đề thi
    getDetail: async (c: Context, next: Next) => {
        const { exam_id } = c.req.param();
        const result = await ExamService.getDetail(exam_id);
        return c.json({ message: "Lấy chi tiết đề thi thành công", data: result }, 200);
    },
    // 📌 Get all exam
    getAll: async (c: Context, next: Next) => {
        // Lấy query params với giá trị mặc định
        const page = Number(c.req.query("page")) || 1;
        const limit = Number(c.req.query("limit")) || 10;
        const search = c.req.query("search") || "";
        // Gọi service để lấy dữ liệu
        const exams = await ExamService.getAll(page, limit, search);
        return c.json({ message: "Lấy danh sách đề thi thành công", data: exams }, 200);
    },
    // 📌 Lấy đề thi theo topic_id
    getByTopicId: async (c: Context, next: Next) => {
        const { topic_id } = c.req.param();
        const result = await ExamService.getByTopicId(topic_id);
        return c.json({ message: "Lấy đề thi theo topic_id thành công", data: result }, 200);
    },
    // // 📌 Xóa đề thi
    // deleteExam: async (c: Context, next: Next) => {
    //     const { exam_id } = c.req.param();
    //     const result = await ExamService.deleteExam(exam_id);
    //     return c.json({ message: "Xóa đề thi thành công", data: result}, 200);
    // },
    // // import exam
    // importExam: async (c: Context, next: Next) => {
    //     const body = await c.req.parseBody();
    //     const file = body["file"];
    //     const result = await ExamService.importExam(file);
    //     return c.json({ message: "Import đề thi thành công", data: result }, 200);
    // },
};