import { HTTPException } from "hono/http-exception";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport/index.js";
import UserModel, { type IUser } from "../models/user.model.js";
import { generateToken } from "../utils/auth.util.js";
import { ProgressService } from "./progress.service.js";
import { LessonService } from "./lesson.service.js";
import { UserProgressService } from "./user_progress.service.js";

let otpStore = new Map<string, { otp: string, expiresAt: number }>(); // Lưu OTP tạm thời

export const AuthService = {
    // 📌 Đăng ký người dùng
    register: async (
        username: string, email: string, password: string,
        otpCode: string, topic_id?: string | null
    ) => {
        // Kiểm tra username đã tồn tại
        const existingUser = await UserModel.findOne({ username, is_delete: false });
        if (existingUser) {
            throw new HTTPException(409, { message: `Username đã được sử dụng!` }); // 409: Conflict
        }
        // Kiểm tra email đã tồn tại
        const existingEmail = await UserModel.findOne({ email, is_delete: false });
        if (existingEmail) {
            throw new HTTPException(409, { message: `Email đã được sử dụng!` }); // 409: Conflict
        }
        // Kiểm tra OTP trước khi đăng ký
        const isValid = await AuthService.verifyOTP(email, otpCode);
        // const isValid = otpCode == "152566"
        if (!isValid) throw new HTTPException(400, { message: "Mã OTP không hợp lệ hoặc đã hết hạn!" });
        // Hash mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);
        // Tạo user mới
        const newUser: IUser = new UserModel({
            username,
            email,
            password_hash: hashedPassword,
            topic_id: topic_id || null
        });
        const savedUser: any = await newUser.save();
        // Lưu user progress đầu tiên
        if (topic_id) {
            const firstProgress: any = await ProgressService.getFirstByTopic(topic_id);
            // Lấy bài học đầu tiên của progress
            const lessons = await LessonService.getByProgressId(firstProgress._id);
            if (lessons) {
                const lesson: any = lessons[0];
                await UserProgressService.processDB({
                    user_id: savedUser._id.toString(), status: "in_progress", score: 0,
                    lesson_id: lesson._id.toString(), progress_id: firstProgress._id.toString(), topic_id,
                    _id: undefined, detail: [],
                });
                // await UserProgressService.processDB({
                //     user_id: savedUser._id,
                //     progress_id: firstProgress._id,
                //     lesson_id: lesson._id,
                //     status: "in_progress",
                //     score: 0,
                //     detail: [],
                //     _id: undefined
                // })
            }
        }
        return savedUser;
    },

    // 📌 Đăng nhập
    login: async (username: string, password: string) => {
        // Kiểm tra người dùng có tồn tại không
        const user = await UserModel.findOne({ username, is_delete: false });
        if (!user) throw new Error("Username hoặc mật khẩu không đúng!");
        // Kiểm tra mật khẩu
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) throw new Error("Username hoặc mật khẩu không đúng!");
        // Tạo token JWT
        const token = await generateToken({
            _id: user._id, role: user.role
        });
        // console.log(token);
        return { token, role: user.role };
    },

    getOTP: async ({ emailTo }: { emailTo: string }) => {
        // Kiểm tra email hoặc username đã tồn tại
        const existingUser = await UserModel.findOne({ email: emailTo, is_delete: false });
        if (existingUser) {
            // const field = existingUser.email === emailTo ? "Email" : "Username";
            throw new HTTPException(409, { message: `Email đã được sử dụng!` }); // 409: Conflict
        }
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // OTP 6 chữ số
        const expiresAt = Date.now() + 5 * 60 * 1000; // Hết hạn sau 5 phút
        otpStore.set(emailTo, { otp: otpCode, expiresAt });
        await AuthService.sendOTPMail({ emailTo, otpCode });
    },

    // 📌 Xác thực OTP
    verifyOTP: async (email: string, otpCode: string, otpStoreInput?: any) => {
        console.log(otpStoreInput)
        if (otpStoreInput) otpStore = otpStoreInput; // Nếu có otpStore truyền vào thì sử dụng
        const otpData = otpStore.get(email);
        if (!otpData) return false;
        if (otpData.expiresAt < Date.now()) {
            otpStore.delete(email); // Xóa OTP hết hạn
            return false;
        }
        if (otpData.otp !== otpCode) return false;
        otpStore.delete(email); // Xóa OTP sau khi dùng
        return true;
    },
    
    sendOTPMail: async (
        { subject, emailTo, otpCode }: { subject?: string, emailTo: string, otpCode: string }
    ) => {
        if (!process.env.MAIL_HOST || !process.env.AUTH_MAIL_USER || !process.env.AUTH_MAIL_PASS) {
            throw new HTTPException(500, { message: "Lỗi hệ thống: Cấu hình email không hợp lệ!" });
        }

        const transport = nodemailer.createTransport({
            host: process.env.MAIL_HOST as string,
            port: Number(process.env.MAIL_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.AUTH_MAIL_USER as string,
                pass: process.env.AUTH_MAIL_PASS as string
            }
        } as SMTPTransport.Options);
    
        transport.verify((error, success) => {
            if (error) {
                console.error("Mail server connection failed:", error);
            } else {
                console.log("Mail server is ready to send messages");
            }
        });
        
        var mailOptions = {
            from: process.env.AUTH_MAIL_USER,
            to: emailTo,
            subject,
            html: `<!DOCTYPE html>
                <html lang="vi">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Mã OTP của bạn</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            background-color: #f4f4f4;
                            margin: 0;
                            padding: 0;
                        }
                        .email-container {
                            max-width: 600px;
                            margin: auto;
                            background-color: #ffffff;
                            padding: 20px;
                            border-radius: 5px;
                            box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
                        }
                        .header {
                            background-color: #4CAF50;
                            padding: 15px;
                            text-align: center;
                            color: #ffffff;
                            font-size: 20px;
                            border-radius: 5px 5px 0 0;
                        }
                        .content {
                            padding: 20px;
                            color: #333333;
                            line-height: 1.6;
                            text-align: center;
                        }
                        .otp-code {
                            font-size: 24px;
                            color: #4CAF50;
                            font-weight: bold;
                            margin: 20px 0;
                        }
                        .footer {
                            text-align: center;
                            padding: 10px;
                            font-size: 12px;
                            color: #777777;
                        }
                    </style>
                </head>
                <body>
                    <div class="email-container">
                        <div class="header">
                            Xác minh tài khoản của bạn
                        </div>
                        <div class="content">
                            <p>Chào bạn,</p>
                            <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi! Để xác thực tài khoản, vui lòng nhập mã OTP dưới đây:</p>
                            <div class="otp-code">${otpCode}</div>
                            <p>Mã OTP này sẽ hết hạn sau 5 phút. Vui lòng không chia sẻ mã này với bất kỳ ai để bảo mật tài khoản của bạn.</p>
                        </div>
                        <div class="footer">
                            <p>Email hỗ trợ: 20210864@eaut.edu.vn</p>
                            <p>Điện thoại: 0342404775</p>
                        </div>
                    </div>
                </body>
            </html>`
        };
        let info = await transport.sendMail(mailOptions);
        if (!info.response) throw new HTTPException(401, { message: "Gửi email thất bại" });
        console.log(`✅ Email đã gửi thành công: ${info.messageId} - OTP: ${otpCode}`);
    },
    getOTPForgotPassword: async ({ emailTo }: { emailTo: string }) => {
        // Kiểm tra email hoặc username đã tồn tại
        const existingUser = await UserModel.findOne({ email: emailTo, is_delete: false });
        if (!existingUser) {
            throw new HTTPException(409, { message: `Email không tồn tại!` }); // 409: Conflict
        }
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // OTP 6 chữ số
        const expiresAt = Date.now() + 5 * 60 * 1000; // Hết hạn sau 5 phút
        otpStore.set(emailTo, { otp: otpCode, expiresAt });
        await AuthService.sendOTPMail({ emailTo, otpCode });
    },
    verifyOTPForgotPassword: async (email: string, otpCode: string) => {
        const otpData = otpStore.get(email);
        if (!otpData) return false;
        if (otpData.expiresAt < Date.now()) {
            otpStore.delete(email); // Xóa OTP hết hạn
            return false;
        }
        if (otpData.otp !== otpCode) return false;
        otpStore.delete(email); // Xóa OTP sau khi dùng
        return true;
    },
    resetPassword: async (email: string, password: string) => {
        // Kiểm tra email hoặc username đã tồn tại
        const existingUser = await UserModel.findOne({ email, is_delete: false });
        if (!existingUser) {
            throw new HTTPException(409, { message: `Email không tồn tại!` }); // 409: Conflict
        }
        // Hash mật khẩu mới
        const hashedPassword = await bcrypt.hash(password, 10);
        // Cập nhật mật khẩu
        await UserModel.updateOne({ email }, { password_hash: hashedPassword });
        return true;
    }
};