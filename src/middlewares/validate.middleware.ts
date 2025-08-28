import { z, ZodError } from "zod";
import type { Context } from "hono";

// 📌 Middleware validate đầu vào với zod
export const validate = (schema: z.ZodSchema) => {
    return async (c: Context, next: () => Promise<void>) => {
        try {
            const body = await c.req.json();
            schema.parse(body);
            await next(); // Chạy middleware tiếp theo
        } catch (error) {
            if (error instanceof ZodError) {
                return c.json({
                    message: "Dữ liệu không hợp lệ!",
                    errors: error.errors.map(err => ({
                        field: err.path.join("."), // Lấy tên trường bị lỗi
                        message: err.message // Thông báo lỗi cụ thể
                    }))
                }, 400);
            }
            return c.json({ message: "Lỗi hệ thống!" }, 500);
        }
    };
};