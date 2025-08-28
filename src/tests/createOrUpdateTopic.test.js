import { testClient } from "hono/testing";
import instanceMongoDb from '../db/mongo.js';
import { TopicService } from "../services/topic.service.js";

beforeAll(async () => {
    await instanceMongoDb.getConnection();
});

test("Testcase 1 - Thêm mới chủ đề thành công", async () => {
    const _id = null;
    const name = "Lập trình mạng";
    const description = "Lập trình mạng mô tả";
    const image = "http://localhost:3000/img.png";

    const result = await TopicService.createOrUpdate(_id, name, description, image);

    expect(result).toHaveProperty("_id"); // Kiểm tra có ID không
    expect(result).toHaveProperty("name", name);
    expect(result).toHaveProperty("description", description);
    expect(result).toHaveProperty("image", image);
}, 30000);

test("Testcase 2 - Chủ đề đã tồn tại", async () => {
    const _id = null;
    const name = "Lập trình mạng"; // Chủ đề này đã tồn tại từ test trước
    const description = "Lập trình mạng mô tả khác";
    const image = "http://localhost:3000/img2.png";

    await expect(TopicService.createOrUpdate(_id, name, description, image))
        .rejects.toThrow("Chủ đề đã tồn tại");
}, 30000);

test("Testcase 3 - Cập nhật chủ đề thành công", async () => {
    // Tạo chủ đề trước khi cập nhật
    const createdTopic = await TopicService.createOrUpdate(null, "Cấu trúc dữ liệu", "Dữ liệu mô tả", "http://localhost:3000/img.png");

    const updatedTopic = await TopicService.createOrUpdate(createdTopic._id, "Cấu trúc dữ liệu nâng cao", "Dữ liệu mô tả nâng cao", "http://localhost:3000/img2.png");

    expect(updatedTopic).toHaveProperty("_id", createdTopic._id);
    expect(updatedTopic).toHaveProperty("name", "Cấu trúc dữ liệu nâng cao");
    expect(updatedTopic).toHaveProperty("description", "Dữ liệu mô tả nâng cao");
    expect(updatedTopic).toHaveProperty("image", "http://localhost:3000/img2.png");
}, 30000);
