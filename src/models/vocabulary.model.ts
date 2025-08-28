import { Schema, model } from "mongoose";

const DOCUMENT_NAME = "vocabulary";
const COLLECTION_NAME = "vocabularies";

// const vocabularySchema = new Schema({
//   word: { type: String, required: true },
//   pronounce: { type: String, required: true },
//   translate: { type: String, required: true },
//   example: { type: String },
//   audio: { type: String }
// }, {
//   collection: COLLECTION_NAME,
//   timestamps: true
// });

const vocabularySchema = new Schema({
  word: { type: String, required: true, trim: true },
  meaning: { type: String, required: true },
  phonetic: { type: String }, // Phiên âm
  vietnamese: { type: String }, // nghĩa tiếng việt
  type: [{
    type: String, 
    enum: ['noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'pronoun', 'determiner'],
    required: true
  }],
  topic_id: { type: Schema.Types.ObjectId, ref: 'topic' },
  examples: [{
    sentence: { type: String, required: true },
    translation: { type: String }
  }],
  audio: {
    uk: { type: String },  // Link audio UK
    us: { type: String }   // Link audio US
  },
  is_delete: { type: Boolean, default: false }
}, {
  collection: COLLECTION_NAME,
  timestamps: true
});

const VocabularyModel = model(DOCUMENT_NAME, vocabularySchema);

export default VocabularyModel;