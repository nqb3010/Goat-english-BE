import { Document, Schema, Types, model } from "mongoose";

const DOCUMENT_NAME = "user";
const COLLECTION_NAME = "users";

// 🛠 Định nghĩa interface cho User
export interface IUser extends Document {
  username: string;
  email: string;
  password_hash: string;
  role: "user" | "admin";
  topic_id: Types.ObjectId | null;
  is_delete?: Boolean;
  streak?: number; // Số ngày streak liên tục
  streak_max?: number; // Số ngày streak liên tục lớn nhất
  streak_start?: Date | null; // Ngày bắt đầu streak
}

const userSchema = new Schema({
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  password_hash: { type: String, required: false },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  topic_id: { type: Schema.Types.ObjectId, ref: "topic", required: false },
  streak: { type: Number, default: 0 }, // Số ngày streak liên tục
  streak_max: { type: Number, default: 0 }, // Số ngày streak liên tục lớn nhất
  streak_start: { type: Date, default: null }, // Ngày bắt đầu streak
  is_delete: { type: Boolean, default: false }
}, {
  collection: COLLECTION_NAME,
  timestamps: true
});

const UserModel = model<IUser>(DOCUMENT_NAME, userSchema);

export default UserModel;