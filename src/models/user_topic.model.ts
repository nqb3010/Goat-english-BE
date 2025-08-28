import { Schema, model } from "mongoose";

const DOCUMENT_NAME = "user_topic";
const COLLECTION_NAME = "user_topics";

const userTopicSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: "user" },
  topic_id: { type: Schema.Types.ObjectId, ref: "topic" }
}, {
  collection: COLLECTION_NAME,
  timestamps: true
});

const UserTopicModel = model(DOCUMENT_NAME, userTopicSchema);

export default UserTopicModel;