import { HTTPException } from "hono/http-exception";

export const asyncHandler = (fn: (c: any, next: any) => Promise<any>) => {
    return async (c: any, next: any) => {
        try {
            return await fn(c, next);
        } catch (error) {
            console.error(error);
            let statusCode = 500;
            let errorMessage = "Lỗi hệ thống!";
            // Kiểm tra nếu error là một HTTPException
            if (error instanceof HTTPException) {
                statusCode = error.status;
                errorMessage = error.message;
            }
            // Kiểm tra nếu error là một Error (JS Error)
            else if (error instanceof Error) {
                errorMessage = error.message;
            }
            return c.json({ status: statusCode, message: errorMessage });
        }
    };
};