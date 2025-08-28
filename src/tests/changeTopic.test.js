import { testClient } from "hono/testing";
import { UserService } from "../services/user.service.js";
import { UserTopicService } from "../services/user_topic.service.js";
import { TopicService } from "../services/topic.service.js";
import UserModel from "../models/user.model.js";
import { UserProgressService } from "../services/user_progress.service.js";
import instanceMongoDb from '../db/mongo.js';

beforeAll(async () => {
    // Kết nối MongoDB trước khi chạy test
    instanceMongoDb.getConnection();
});

test("Testcase 1 - Người dùng không tồn tại", async () => {
    await expect(
        UserService.changeTopic("67dc4591b0f8d7827ce13999", "67b2da41f25a4c444d4ed5f0", "start")
    ).rejects.toThrow("Người dùng không tồn tại");
}, 30000);

test("Testcase 2 - Chủ đề không tồn tại", async () => {
    await expect(
        UserService.changeTopic("67ed437f1df2776dac635fdb", "62b2da41f25a3c424d4ed5f0", "start")
    ).rejects.toThrow("Chủ đề không tồn tại");
}, 30000);

test("Testcase 3 - Người dùng bắt đầu chủ đề mới thành công", async () => {
    jest.spyOn(UserModel, 'findById').mockResolvedValue({
        _id: "67e6cb0824fdbeab2b11b5ca",
        username: "parkseohai",
        topic_id: null,
        save: jest.fn()
    });

    jest.spyOn(TopicService, 'getById').mockResolvedValue({
        _id: "67b2d9c2f25a4c444d4ed5ec",
        name: "Chủ đề mới"
    });

    jest.spyOn(UserTopicService, 'processDB').mockResolvedValue({
        user_id: "67e6cb0824fdbeab2b11b5ca",
        topic_id: "67b2d9c2f25a4c444d4ed5ec"
    });

    jest.spyOn(UserProgressService, 'processDB').mockResolvedValue({
        user_id: "67e6cb0824fdbeab2b11b5ca",
        status: "in_progress",
        score: 0,
        lesson_id: null,
        progress_id: null,
        topic_id: "67b2d9c2f25a4c444d4ed5ec"
    });

    const result = await UserService.changeTopic("67e6cb0824fdbeab2b11b5ca", "67b2d9c2f25a4c444d4ed5ec", "start");
    expect(result.newUserTopic.topic_id).toBe("67b2d9c2f25a4c444d4ed5ec");
}, 30000);

test("Testcase 4 - Thành công khi thay đổi chủ đề mà không bắt đầu chủ đề mới", async () => {
    jest.spyOn(UserModel, 'findById').mockResolvedValue({
        _id: "67e6cb0824fdbeab2b11b5ca",
        username: "parkseohai",
        topic_id: "67b2d9c2f25a4c444d4ed5ec",
        save: jest.fn()
    });

    jest.spyOn(TopicService, 'getById').mockResolvedValue({
        _id: "67b2d9c2f25a4c444d4ed5ec",
        name: "Chủ đề cũ"
    });

    const result = await UserService.changeTopic("67e6cb0824fdbeab2b11b5ca", "67b2d9c2f25a4c444d4ed5ec", "change");
    expect(result._id).toBe("67e6cb0824fdbeab2b11b5ca");
}, 30000);

test("Testcase 5 - Lỗi server khi thay đổi chủ đề", async () => {
    jest.spyOn(UserModel, 'findById').mockRejectedValue(new Error("Có lỗi từ server"));

    await expect(
        UserService.changeTopic("67e6cb0824fdbeab2b11b5ca", "67b2d9c2f25a4c444d4ed5ec", "start")
    ).rejects.toThrow("Có lỗi từ server");
}, 30000);
