import { sign, verify } from "hono/jwt";
import dotenv from 'dotenv';
// Load các biến môi trường từ tệp .env
dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET;
const EXPIRES_IN_SECONDS = 60 * 60 * 24; // 1 ngày

// 📌 Tạo JWT
export const generateToken = async (user: { _id: any; role: string }) => {
    if (!SECRET_KEY) return null;
    return await sign(
        { userId: user._id, role: user.role, exp: Math.floor(Date.now() / 1000) + EXPIRES_IN_SECONDS },
        SECRET_KEY
    );
};

// 📌 Xác minh JWT
export const verifyToken = async (token: string) => {
    try {
        if (!SECRET_KEY) return null;
        return await verify(token, SECRET_KEY);
    } catch (error) {
        return null;
    }
};
