import { Hono } from 'hono';
import { AuthController } from '../controllers/auth.controller.js';
import { asyncHandler } from '../utils/async_handler.util.js';
import { validate } from '../middlewares/validate.middleware.js';
import { registerSchema, loginSchema, emailSchema } from '../validators/auth.validator.js';

const app = new Hono();

// 📌 Đăng ký người dùng
app.post("/register", validate(registerSchema), asyncHandler(AuthController.register));
// 📌 Đăng nhập
app.post("/login", validate(loginSchema), asyncHandler(AuthController.login));
// 📌 Send OTP
app.post("/send-otp", validate(emailSchema), asyncHandler(AuthController.sendOTP));
// 📌 Send OTP forgot password
app.post("/send-otp-forgot-password", validate(emailSchema), asyncHandler(AuthController.sendOTPForgotPassword));
// 📌 Verify OTP forgot password
app.post("/verify-otp-forgot-password", validate(emailSchema), asyncHandler(AuthController.verifyOTPForgotPassword));
// reset password
app.post("/reset-password", validate(emailSchema), asyncHandler(AuthController.resetPassword));

export default app;