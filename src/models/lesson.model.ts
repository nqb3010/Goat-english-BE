import { Document, Schema, model } from "mongoose";

const DOCUMENT_NAME = "lesson";
const COLLECTION_NAME = "lessons";

export interface ILesson extends Document {
  title: string;
  description: string;
  order: number;
  exercises: string[];
  vocabularies: string[];
  min_score: number;
  progress_id: string;
  status: string;
  is_delete: boolean;
}

const lessonSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  order: { type: Number, required: true },
  exercises: [{ type: Schema.Types.ObjectId, ref: "exercise", default: [] }],
  vocabularies: [{ type: Schema.Types.ObjectId, ref: "vocabulary", default: [] }],
  min_score: { type: Number, min: 0, default: 0 },  // Điểm tối thiểu để mở khóa bài học này
  progress_id: { type: Schema.Types.ObjectId, ref: "progress" },
  status: { type: String, enum: ["publish", "draft"], default: "publish" },  // publish, draft
  is_delete: { type: Boolean, default: false },
}, {
  collection: COLLECTION_NAME,
  timestamps: true
});

const LessonModel = model<ILesson>(DOCUMENT_NAME, lessonSchema);

export default LessonModel;