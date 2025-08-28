import { z } from "zod";

// 📌 Schema kiểm tra đầu vào đăng ký
export const registerSchema = z
    .object({
        username: z.string()
            .min(3, "Tên người dùng phải có ít nhất 3 ký tự"),
        email: z.string().email("Email không hợp lệ"),
        password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
        confirm_password: z.string().min(6, "Xác nhận mật khẩu phải có ít nhất 6 ký tự"),
        otp_code: z.string().length(6, "Mã OTP phải có đúng 6 chữ số"),
        topic_id: z.string().optional()
    })
    .refine((data) => data.password === data.confirm_password, {
        message: "Mật khẩu xác nhận không khớp",
        path: ["confirm_password"]
    });

// 📌 Schema kiểm tra đầu vào đăng nhập
export const loginSchema = z.object({
    username: z.string().min(2, "Username không được trống!"),
    password: z.string().min(2, "Password không được trống!"),
});

export const emailSchema = z.object({
    email: z.string().email("Email không hợp lệ"),
});