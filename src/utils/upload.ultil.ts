import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import { HTTPException } from 'hono/http-exception';

export const uploadFileImg = async (file: any, folderName: string, options = {}): Promise<UploadApiResponse> => {
    try {
        const transformation = [
            { quality: 'auto' }, // Tự động tối ưu chất lượng
            { fetch_format: 'auto' } // Tự động chọn định dạng phù hợp (webp, jpeg...)
        ];
        // if (options) transformation.push(options);
        const uploadResponse = await cloudinary.uploader.upload(file, {
            folder: folderName, transformation
        }).catch((err) => {
            console.log(err);
            throw new HTTPException(500, { message: "Upload file thất bại" });
        });
        return uploadResponse;
    } catch (err) {
        console.error(err);
        throw new HTTPException(500, { message: "Upload file thất bại" });
    }
}