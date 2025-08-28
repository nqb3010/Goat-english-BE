import { testClient } from "hono/testing";
import instanceMongoDb from '../db/mongo.js';
import { UserService } from "../services/user.service.js";
import { AuthService } from "../services/auth.service.js";
import UserModel from "../models/user.model.js";

beforeAll(async () => {
    instanceMongoDb.getConnection();
});

test("Testcase 1 - Email đã tồn tại", async () => {
    await expect(
        UserService.updateInfor("67dc4591b0f8d7827ce13807", "nguyenvanhai282003", "nvhai2803@gmail.com", null)
    ).rejects.toThrow("Email đã tồn tại");
}, 30000);

test("Testcase 2 - Tên đăng nhập đã tồn tại", async () => {
    await expect(
        UserService.updateInfor("67dc4591b0f8d7827ce13807", "nguyenvanhai", "anhhai28212003@gmail.com", null)
    ).rejects.toThrow("Tên đăng nhập đã tồn tại");
}, 30000);

test("Testcase 3 - Người dùng không tồn tại", async () => {
    await expect(
        UserService.updateInfor("67dc4591b0f8d7827ce13999", "nguyenvanhai282003", "anhhai23333@gmail.com", null)
    ).rejects.toThrow("Người dùng không tồn tại");
}, 30000);

test("Testcase 4 - Mã OTP không hợp lệ hoặc đã hết hạn", async () => {
    jest.spyOn(AuthService, 'verifyOTP').mockResolvedValue(false);
    await expect(
        UserService.updateInfor("67dc4591b0f8d7827ce13807", "nguyenvanhai282003", "anhh342343@gmail.com", "912192")
    ).rejects.toThrow("Mã OTP không hợp lệ hoặc đã hết hạn!");
}, 30000);

test("Testcase 5 - Cập nhật thông tin thành công", async () => {
    jest.spyOn(UserModel, 'findById').mockResolvedValue({
        _id: "67dc4591b0f8d7827ce13807",
        username: "nguyenvanhai282003",
        email: "nvhai2803@gmail.com",
        save: jest.fn()
    });
    const result = await UserService.updateInfor("67dc4591b0f8d7827ce13807", "nguyenva82003", "nvhai28023233@gmail.com", null);
    expect(result.status).toBe(200);
    expect(result.message).toBe("Cập nhật thông tin thành công");
}, 30000);

test("Testcase 6 - Gửi OTP thành công", async () => {
    jest.spyOn(AuthService, 'sendOTPMail').mockResolvedValue(true);
    const result = await UserService.updateInfor("67dc4591b0f8d7827ce13807", "nguyenvanhai9999", "nvhai2843203@gmail.com", null);
    expect(result.status).toBe(200);
    expect(result.message).toBe("Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra email để xác nhận thay đổi.");
}, 30000);

test("Testcase 7 - Lỗi server", async () => {
    jest.spyOn(UserModel, 'findById').mockRejectedValue(new Error("Có lỗi từ server"));
    await expect(
        UserService.updateInfor("67dc4591b0f8d7827ce13807", "nguyenvanh003", "nv882803@gmail.com", null)
    ).rejects.toThrow("Có lỗi từ server");
}, 30000);