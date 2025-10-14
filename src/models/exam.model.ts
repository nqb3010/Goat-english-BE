import { Document, Schema, model } from "mongoose";

const DOCUMENT_NAME = "exam";
const COLLECTION_NAME = "exams";

export interface IExam extends Document {
    name: string;
    description?: string;
    image?: string;
    topic_id: string; // Tham chiếu đến chủ đề (topic) của đề thi
    exercises: string[]; // Mảng các ObjectId tham chiếu đến bài tập
    total_questions: number;
    duration: number; // Thời gian làm bài tính bằng phút
    created_by: string; // Tham chiếu đến người tạo đề thi
    status?: string; // Trạng thái của đề thi (ví dụ: "active", "inactive")
    is_delete?: boolean;
}

const ExamSchema = new Schema<IExam>(
    {
        name: { type: String, required: true },
        description: { type: String },
        image: { type: String },
        topic_id: { type: Schema.Types.ObjectId, ref: "topic", required: true },
        exercises: [{ type: Schema.Types.ObjectId, ref: "exercise" }],
        total_questions: { type: Number, required: true },
        duration: { type: Number, required: true },
        status: { type: String, enum: ["publish", "draft"], default: "publish" },  // publish, draft
        is_delete: { type: Boolean, default: false },
    },
    { timestamps: true, collection: COLLECTION_NAME }
);

const ExamModel = model<IExam>(DOCUMENT_NAME, ExamSchema);

export default ExamModel;