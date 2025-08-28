import { Document, Schema, model } from "mongoose";

const DOCUMENT_NAME = "exercise_type";
const COLLECTION_NAME = "exercise_types";

export interface IExerciseType extends Document {
  ma_muc: string;
  ten_muc: string;
}

const exerciseTypeSchema = new Schema({
  ma_muc: { type: String, require: true },
  ten_muc: { type: String, require: true }
}, {
  collection: COLLECTION_NAME,
  timestamps: true
});

const ExerciseTypeModel = model<IExerciseType>(DOCUMENT_NAME, exerciseTypeSchema);

export default ExerciseTypeModel;