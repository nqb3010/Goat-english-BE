import { Document, Schema, model } from "mongoose";

const DOCUMENT_NAME = "topic";
const COLLECTION_NAME = "topics";

export interface ITopic extends Document {
  name: string;
  description: string;
  image: string;
  isDelete?: boolean;
}

const topicSchema = new Schema({
  name: { type: String, unique: true, required: true },
  description: { type: String, default: "" },
  image: { type: String },
  isDelete: { type: Boolean, default: false }
}, {
  collection: COLLECTION_NAME,
  timestamps: true
});

const TopicModel = model<ITopic>(DOCUMENT_NAME, topicSchema);

export default TopicModel;