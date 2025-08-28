import { HTTPException } from "hono/http-exception";
import { getInfoData } from "../utils/index.js";
import VocabularyModel from "../models/vocabulary.model.js";
import _ from "lodash";
import { TopicService } from "./topic.service.js";

export const VoCabularyService = {
    createOrUpdate: async (
        _id: string, word: string, meaning: string, phonetic: string, type: string, 
        topic_id: string, examples: string[], audio: {}, vietnamese: string
    ) => {
        // Cập nhật hoặc tạo mới nếu `_id` không tồn tại
        let updatedVocabulary;
        if (!_id) {
            updatedVocabulary = await VocabularyModel.create({
                word, meaning, type, topic_id, examples, audio, phonetic, vietnamese
            });
        } else {
            updatedVocabulary = await VocabularyModel.findOneAndUpdate(
                { _id },
                { word, meaning, type, topic_id, examples, audio, phonetic, vietnamese },
                { upsert: true, new: true }
            );
        }
        return getInfoData({ data: updatedVocabulary, fields: ["_id", "word", "meaning", "type", "phonetic", "topic_id", "examples", "audio", "vietnamese"] });
    },
    // 📌 Get vocabulary by id
    getById: async (vocabulary_id: string) => {
        const vocabulary = await VocabularyModel.findById(vocabulary_id).lean();
        if (!vocabulary) throw new HTTPException(404, { message: "Không tìm thấy từ vựng" });
        return getInfoData({ data: vocabulary, fields: ["_id", "word", "meaning", "type", "phonetic", "topic_id", "examples", "audio", "vietnamese"] });
    },
    getAll: async (page = 1, limit = 10, search = '') => {
        const query: any = { is_delete: false };
        if (search) {
            query.$or = [
                { word: { $regex: search, $options: 'i' } },
                { meaning: { $regex: search, $options: 'i' } },
            ];
        }
        const vocabularies = await VocabularyModel.find(query).skip((page - 1) * limit).limit(limit).lean();
        const totalRecords = await VocabularyModel.countDocuments(query);
        const totalPages = Math.ceil(totalRecords / limit);
        return {
            vocabularies: vocabularies.map((vocabulary) => getInfoData({ data: vocabulary, fields: ["_id", "word", "meaning", "type", "phonetic", "topic_id", "examples", "audio", "vietnamese"] })),
            pagination: {
                currentPage: page,
                totalPages,
                totalRecords,
            },
        };
    },
    deleteById: async (vocabulary_id: string) => {
        const vocabulary = await VocabularyModel.findById(vocabulary_id);
        if (!vocabulary) throw new HTTPException(404, { message: "Không tìm thấy từ vựng" });
        vocabulary.is_delete = true;
        await vocabulary.save();
        return getInfoData({ data: vocabulary, fields: ["_id", "word", "meaning", "type", "phonetic", "topic_id", "examples", "audio", "vietnamese"] });
    },
    getAllByTopic: async (topic_id: string, page: number, limit: number, search: string, sort: string) => {
        const topic = await TopicService.getById(topic_id);
        const query: any = { topic_id, is_delete: false };
        if (search) {
            query.$or = [
                { word: { $regex: search, $options: 'i' } },
                { meaning: { $regex: search, $options: 'i' } },
            ];
        }
        // sort input example: "createdAt:desc,word:asc"
        let sortOptions: any = { createdAt: -1 };
        if (sort) {
            sortOptions = sort.split(',').reduce((acc: any, item: string) => {
                const [key, value] = item.split(':');
                acc[key] = value === 'desc' ? -1 : 1;
                return acc;
            }, {});
        }
        const vocabularies = await VocabularyModel.find(query).skip((page - 1) * limit).limit(limit)
            .populate("topic_id").sort(sortOptions).lean();
        const totalRecords = await VocabularyModel.countDocuments(query);
        const totalPages = Math.ceil(totalRecords / limit);
        return {
            vocabularies: vocabularies.map((vocabulary) => getInfoData({ 
                data: vocabulary, fields: ["_id", "word", "meaning", "type", "phonetic", "topic_id", "examples", "audio", "vietnamese"] 
            })),
            topic: getInfoData({ data: topic, fields: ["_id", "name", "description"] }),
            pagination: {
                currentPage: page,
                totalPages,
                totalRecords,
            },
        };
    },
    getVocabularyIdByName: async (name: string) => {
        const vocabulary = await VocabularyModel.findOne({ word: { $regex: name, $options: 'i' }, is_delete: false });
        if (!vocabulary) throw new HTTPException(404, { message: "Từ vựng không tồn tại" });
        return vocabulary._id;
    },
    getVocabularyIdByNameAndTopic: async (name: string, topic_id: string) => {
        const vocabulary = await VocabularyModel.findOne({ word: { $regex: `^${name}$`, $options: 'i' }, topic_id, is_delete: false });
        if (!vocabulary) throw new HTTPException(404, { message: "Từ vựng không tồn tại" });
        return vocabulary._id;
    },
};