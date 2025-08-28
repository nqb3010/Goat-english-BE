import { Document, Schema, model } from "mongoose";

const DOCUMENT_NAME = "progress";
const COLLECTION_NAME = "progresses";

export interface IProgress extends Document {
  name: string;
  description: string;
  icon: string,
  order: number;
  topic_id: string;
  is_delete?: Boolean
}

const progressSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  icon: { type: String, default: "" },
  order: { type: Number, required: true },
  topic_id: { type: Schema.Types.ObjectId, ref: "topic", required: true },
  is_delete: { type: Boolean, default: false }
}, {
  collection: COLLECTION_NAME,
  timestamps: true
});

const ProgressModel = model<IProgress>(DOCUMENT_NAME, progressSchema);

export default ProgressModel;