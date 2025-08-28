import { testClient } from "hono/testing";
import { AuthService } from "../services/auth.service.js";
import UserModel from "../models/user.model.js";
import bcrypt from "bcryptjs";
import instanceMongoDb from '../db/mongo.js';

beforeAll(async () => {
    instanceMongoDb.getConnection();
});

test("Testcase 1 - Đăng ký thành công!", async () => {
    const username = "nguyenvanhaitest";
    const email = "anhhai282003@gmail.com";
    const password = "123456";
    const otpCode = "152566";

    const result = await AuthService.register(username, email, password, otpCode);

    // Kiểm tra kết quả trả về là một object chứa email và username mong đợi
    expect(result).toHaveProperty("email", email);
    expect(result).toHaveProperty("username", username);
}, 30000);

test("Testcase 2 - Đăng ký thất bại do username đã tồn tại!", async () => {
    const username = "admin";
    const email = "anhhai282003@gmail.com";
    const password = "123456";
    const otpCode = "152566";

    await expect(AuthService.register(username, email, password, otpCode))
        .rejects.toThrow("Username đã được sử dụng!");
}, 30000);

test("Testcase 3 - Đăng ký thất bại do email đã tồn tại!", async () => {
    const username = "nguyenvanhaitest123";
    const email = "admin@gmail.com";
    const password = "123456";
    const otpCode = "152566";

    await expect(AuthService.register(username, email, password, otpCode))
        .rejects.toThrow("Email đã được sử dụng!");
}, 30000);

test("Testcase 4 - Đăng ký thất bại do OTP không hợp lệ!", async () => {
    const username = "nguyenvanhaitest999";
    const email = "nshc223@gmail.com";
    const password = "123456";
    const otpCode = "123978";

    await expect(AuthService.register(username, email, password, otpCode))
        .rejects.toThrow("Mã OTP không hợp lệ hoặc đã hết hạn!");
}, 30000);