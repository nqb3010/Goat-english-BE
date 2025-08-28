import { Document, Schema, model } from "mongoose";

const DOCUMENT_NAME = "exercise_level";
const COLLECTION_NAME = "exercise_levels";

export interface IExerciseLevel extends Document {
  ma_muc: string;
  ten_muc: string;
}

const exerciseLevelSchema = new Schema({
  ma_muc: { type: String, require: true },
  ten_muc: { type: String, require: true }
}, {
  collection: COLLECTION_NAME,
  timestamps: true
});

const ExerciseLevelModel = model<IExerciseLevel>(DOCUMENT_NAME, exerciseLevelSchema);

export default ExerciseLevelModel;