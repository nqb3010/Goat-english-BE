import { Document, Schema, model } from "mongoose";

const DOCUMENT_NAME = "exercise";
const COLLECTION_NAME = "exercises";

export interface IExercise extends Document {
  type: string;
  level: string;
  question: string;
  options?: string[];
  multiple_correct: boolean;
  correct_answer?: string | string[];
  audio?: string;
  explain_answer?: string;
  explain_answer_vn?: string;
}

const exerciseSchema = new Schema({
  type: { type: Schema.Types.ObjectId, ref: "exercise_type", required: true }, // Liên kết với ExerciseType
  level: { type: Schema.Types.ObjectId, ref: "exercise_level", required: true }, // Liên kết với ExerciseLevel
  question: { type: String, required: true },
  options: { type: Schema.Types.Mixed },    // Nếu là bài tập lựa chọn đáp án
  multiple_correct: { type: Boolean, default: false },    // Bài tập có nhiều đáp án đúng hay ko
  correct_answer: { type: Schema.Types.Mixed, required: true }, // String hoặc Array<String>
  audio: { type: String },        // Nếu là bài tập nghe
  explain_answer: { type: String },  // Giải thích đáp án
  explain_answer_vn: { type: String }  // Giải thích đáp án tiếng việt
}, {
  collection: COLLECTION_NAME,
  timestamps: true
});

const ExerciseModel = model<IExercise>(DOCUMENT_NAME, exerciseSchema);

export default ExerciseModel;