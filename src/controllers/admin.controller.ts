import type { Context, Next } from "hono";
import { AdminService } from "../services/admin.service.js";

export const AdminController = {
    getData: async (c: Context, next: Next) => {
        const user = c.get("user");
        const data = await AdminService.getData();
        return c.json({ message: "Lấy dữ liệu thành công", data }, 200);
    },

    getReport: async (c: Context, next: Next) => {
        const user = c.get("user");
        const data = await AdminService.getReport();
        return c.json({ message: "Lấy dữ liệu thành công", data }, 200);
    },
};
