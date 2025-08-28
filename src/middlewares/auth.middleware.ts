import { type Context, type MiddlewareHandler, type Next } from "hono"
import { verifyToken } from "../utils/auth.util.js"
import UserModel from "../models/user.model.js";

// 📌 Middleware xác thực JWT
export const authenticate: MiddlewareHandler = async (c: Context, next: Next) => {
    const token = c.req.header("Authorization")?.split(" ")[1];
    if (!token) return c.json({ message: "Bạn chưa đăng nhập!" }, 401);

    const decoded = await verifyToken(token);
    if (!decoded) return c.json({ message: "Token không hợp lệ!" }, 401);

    // check user
    const user = await UserModel.findOne({ _id: decoded.userId, is_delete: false });
    if (!user) return c.json({ message: "Người dùng không tồn tại!" }, 401);

    c.set("user", decoded);
    await next();
};

// 📌 Middleware kiểm tra quyền Admin
export const authorizeAdmin: MiddlewareHandler = async (c: Context, next: Next) => {
    const user = c.get("user");
    if (user.role !== "admin") {
        return c.json({ message: "Bạn không có quyền truy cập!" }, 403);
    }
    await next();
};
