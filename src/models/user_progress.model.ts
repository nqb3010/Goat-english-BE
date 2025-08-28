import { Document, Schema, model } from "mongoose";

const DOCUMENT_NAME = "user_progress";
const COLLECTION_NAME = "user_progresses";

export interface IUserProgress extends Document {
  user_id: string;
  progress_id: string;
  lesson_id: string;
  topic_id: string;
  status: string,
  score: number;
  detail: [
    {
      exercise_id: string,
      question: string,
      correct_answer: string | string[],
      user_answer: string | string[],
      correct: boolean
    }
  ];
}

const userProgressSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: "user", required: true },
  progress_id: { type: Schema.Types.ObjectId, ref: "progress", required: true },
  lesson_id: { type: Schema.Types.ObjectId, ref: "lesson", default: null },
  topic_id: { type: Schema.Types.ObjectId, ref: "topic", required: true },
  status: { type: String, enum: ["in_progress", "completed"], default: "in_progress" },
  score: { type: Number, default: 0 },
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

const UserProgressModel = model<IUserProgress>(DOCUMENT_NAME, userProgressSchema);

export default UserProgressModel;