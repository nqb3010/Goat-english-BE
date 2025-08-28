import { testClient } from "hono/testing";
import { AuthService } from "../services/auth.service.js";
import UserModel from "../models/user.model.js";
import bcrypt from "bcryptjs";
import instanceMongoDb from '../db/mongo.js';

beforeAll(async () => {
    instanceMongoDb.getConnection();
});

test("Testcase 1 - Đăng nhập thành công", async () => {
    const username = "admin";
    const password = "123456";

    const result = await AuthService.login(username, password);
    expect(result).toHaveProperty("token"); // Kiểm tra có token không
}, 30000);

test("Testcase 2 - Đăng nhập thất bại username sai", async () => {
    const username = "admin21121";
    const password = "123456";

    await expect(AuthService.login(username, password)).rejects.toThrow("Username hoặc mật khẩu không đúng!");
}, 30000);

test("Testcase 3 - Đăng nhập thất bại với mật khẩu sai", async () => {
    const username = "admin";
    const password = "20192993";

    await expect(AuthService.login(username, password)).rejects.toThrow("Username hoặc mật khẩu không đúng!");
}, 30000);