import { Schema, model, Document } from "mongoose";

const DOCUMENT_NAME = "user_exam";
const COLLECTION_NAME = "user_exams";

export interface IUserExam extends Document {
    user_id: string;
    exam_id: string;
    topic_id: string;
    score: number;
    status: string;
    detail: [
        {
            exercise_id: string;
            question: string;
            correct_answer: string | string[];
            user_answer: string | string[];
            correct: boolean;
        }
    ];
}
const userExamSchema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: "user", required: true },
    exam_id: { type: Schema.Types.ObjectId, ref: "exam", required: true },
    topic_id: { type: Schema.Types.ObjectId, ref: "topic", required: true },
    score: { type: Number, default: 0 },
    status: { type: String, enum: ["in_progress", "completed"], default: "in_progress" },
    detail: [{
        exercise_id: { type: String }, // Bài tập đã làm
        question: { type: String }, // Câu hỏi
        correct_answer: { type: Schema.Types.Mixed },
        user_answer: { type: Schema.Types.Mixed }, // Câu trả lời của user (String hoặc Array<String>)
        correct: { type: Boolean }, // Đáp án đúng/sai
    }]
}, {
    collection: COLLECTION_NAME,
    timestamps: true
});

const UserExamModel = model<IUserExam>(DOCUMENT_NAME, userExamSchema);

export default UserExamModel;