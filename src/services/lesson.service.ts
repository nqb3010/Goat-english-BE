import { HTTPException } from "hono/http-exception";
import { getInfoData } from "../utils/index.js";
import LessonModel, { type ILesson } from "../models/lesson.model.js";
import { ExerciseService } from "./exercise.service.js";
import { VoCabularyService } from "./vocabulary.service.js";
import { Types } from "mongoose";
import { ProgressService } from "./progress.service.js";
import { TopicService } from "./topic.service.js";
import * as XLSX from "xlsx";
import { ExerciseTypeService } from "./exercise_type.service.js";
import { ExerciseLevelService } from "./exercise_level.service.js";

export const LessonService = {
    // 📌 Tạo mới hoặc cập nhật bài học
    createOrUpdate: async (
        _id: string | null, title: string, description: string, order: number,
        exercises: { 
            _id: string, type: string, level: string, question: string, options: string[], 
            multiple_correct: boolean, correct_answer: string, audio: string, explain_answer: string,
            explain_answer_vn: string
        }[],
        vocabularies: string[], progress_id: string, status: string, min_score: number = 0
    ) => {
        // Kiểm tra trạng thái hợp lệ
        if (!["publish", "draft"].includes(status)) {
            throw new HTTPException(400, { message: "Trạng thái không hợp lệ" });
        }
        // Xử lý bài tập
        const processExercises = async () => {
            return Promise.all(exercises.map(async (exercise) => {
                const newExercise = await ExerciseService.createOrUpdate(exercise);
                if (!newExercise) throw new HTTPException(400, { message: "Không thể tạo hoặc cập nhật bài tập" });
                return newExercise._id;
            }));
        };
        const [newExercises] = await Promise.all([processExercises()]);
        // Kiểm tra xem bài học đã tồn tại chưa
        const updateData = { title, description, order, min_score, exercises: newExercises, vocabularies, progress_id, status };
        const lesson = await LessonModel.findByIdAndUpdate(_id || new Types.ObjectId(), updateData, { new: true, upsert: true });
        return lesson;
    },
    // 📌 Get lesson by id
    getById: async (lesson_id: string) => {
        const lesson = await LessonModel.findById(lesson_id).lean();
        if (!lesson) throw new HTTPException(404, { message: "Không tìm thấy bài học" });
        // return getInfoData({ data: lesson, fields: ["_id", "title", "description", "order", "exercises", "vocabulary", "min_score"] });
        return lesson;
    },
    // 📌 Lấy chi tiết bài học
    getDetail: async (lesson_id: string) => {
        const lesson = await LessonModel.findById(lesson_id).lean();
        if (!lesson) throw new HTTPException(404, { message: "Không tìm thấy bài học" });
        // get exercises by ref id
        const exercisesPromise = await Promise.all(lesson.exercises.map(async (exercise_id: string) => {
            const exercise = await ExerciseService.getById(exercise_id);
            return getInfoData({ 
                data: exercise, fields: [
                    "_id", "type", "level", "question", "options", "multiple_correct", 
                    "correct_answer", "audio", "explain_answer", "explain_answer_vn"]
            });
        }));
        // get vocabularies by ref id
        const vocabulariesPromise = await Promise.all(lesson.vocabularies.map(async (vocabulary_id: string) => {
            const vocabulary = await VoCabularyService.getById(vocabulary_id);
            return vocabulary;
        }));
        // get progress by ref id
        const progress = await ProgressService.getById(lesson.progress_id);
        // get topic by ref id
        const topic = await TopicService.getById(progress.topic_id);
        return {
            ...getInfoData({ data: lesson, fields: ["_id", "title", "description", "order", "progress_id", "exercises", "vocabularies", "status"] }),
            exercises: exercisesPromise, progress, vocabularies: vocabulariesPromise, topic
        };
    },
    getFirstByProgress: async (progress_id: string) => {
        const lesson = await LessonModel
            .findOne({ progress_id, is_delete: false })
            .sort({ order: 1 }).lean();
        return lesson;
    },
    // 📌 Get lesson by progress
    getByProgressId: async (progress_id: string) => {
        const lessons = await LessonModel.find({ progress_id, is_delete: false }).sort({ order: 1 }).lean();
        return lessons;
    },
    // 📌 Get all lesson
    getAll: async (page = 1, limit = 10, search = '') => {
        const query: any = { is_delete: false };
        // Nếu có từ khóa tìm kiếm, tìm theo tiêu đề hoặc mô tả của topic
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } }, // Tìm trong name của lesson
                { description: { $regex: search, $options: 'i' } }, // Tìm trong description của lesson
            ];
        }
        // Tính toán số bản ghi bỏ qua
        const skip = (page - 1) * limit;
        // Truy vấn dữ liệu với populate, phân trang và tìm kiếm
        const lessons = await LessonModel.find(query)
            .skip(skip) // Bỏ qua số lượng bản ghi tương ứng với trang
            .limit(limit) // Giới hạn số lượng bản ghi mỗi trang
            .sort({ createdAt: -1 }); // Sắp xếp mới nhất trước
        // Lấy tổng số lượng bản ghi (phục vụ cho tổng số trang)
        const totalRecords = await LessonModel.countDocuments(query);
        const totalPages = Math.ceil(totalRecords / limit);
        return {
            lessons,
            pagination: {
                currentPage: page,
                totalPages,
                totalRecords,
            },
        };
    },
    // 📌 Xóa bài học
    deleteLesson: async (lesson_id: string) => {
        const lesson = await LessonModel.findByIdAndUpdate(lesson_id, { is_delete: true }, { new: true });
        if (!lesson) throw new HTTPException(404, { message: "Không tìm thấy bài học" });
        return lesson;
    },
    // import lesson
    importLesson: async (file: any) => {
        if (!file || !(file instanceof File)) {
            throw new HTTPException(400, { message: "Không tìm thấy file" });
        }
        // Read file once and cache workbook
        const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
        // Validate worksheets exist
        if (!workbook.SheetNames[0] || !workbook.SheetNames[1]) {
            throw new HTTPException(400, { message: "File không đúng định dạng" });
        }
        // Parse worksheets in parallel
        const [dataLessons, dataExercises] = await Promise.all([
            XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {
                header: ["stt", "title", "description", "order", "min_score", "topic", "progress", "vocabularies"],
                defval: ""
            }),
            XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[1]], {
                header: ["stt", "stt_lesson", "type", "level", "question", "options", "correct_answer", "audio", "explain_answer", "explain_answer_vn"],
                defval: ""
            })
        ]);
        // Group exercises by lesson for faster lookup
        const exercisesByLesson: Record<string, any[]> = dataExercises.reduce((acc: Record<string, any[]>, exercise: any) => {
            if (!acc[exercise.stt_lesson]) acc[exercise.stt_lesson] = [];
            acc[exercise.stt_lesson].push(exercise);
            return acc;
        }, {});
        const newLessons = await Promise.all(dataLessons.map(async (lesson: any) => {
            const { stt, title, description, order, min_score, topic, progress, vocabularies } = lesson;
            
            if (!(stt && Number(stt) > 0 && title && description && topic && progress)) {
                return null;
            }
            const topic_id: any = await TopicService.getTopicIdByName(topic);
            const progress_id = await ProgressService.getProgressIdByNameAndTopic(progress, topic_id);
            let vocabulary_ids = [];
            if (vocabularies && vocabularies.length > 0) {
                const words = vocabularies.split(/\r?\n/);
                vocabulary_ids = await Promise.all(
                    words.map((word: string) => VoCabularyService.getVocabularyIdByNameAndTopic(word, topic_id))
                );
            }
            const exercises = exercisesByLesson[stt] || [];
            console.log("exercise.type", stt);
            const newExercises = await Promise.all(exercises.map(async (exercise: any) => {
                const [type_id, level_id] = await Promise.all([
                    ExerciseTypeService.getTypeIdByName(exercise.type?.trim()),
                    ExerciseLevelService.getLevelIdByName(exercise.level?.trim())
                ]);
                let options_array = [];
                if (exercise.options && exercise.options.length > 0) {
                    options_array = exercise.options.split(/\r?\n/).map((option: { split: (arg0: string) => { (): any; new(): any; map: { (arg0: (s: any) => any): [any, any]; new(): any; }; }; }) => {
                        const [ma_dap_an, noi_dung] = option.split(".").map((s: string) => s.trim());
                        return { ma_dap_an, noi_dung };
                    });
                }
                return {
                    _id: new Types.ObjectId().toString(),
                    type: type_id.toString(),
                    level: level_id.toString(),
                    question: exercise.question.toString(),
                    options: options_array,
                    multiple_correct: false,
                    correct_answer: exercise.correct_answer.toString(),
                    audio: exercise.audio.toString(),
                    explain_answer: exercise.explain_answer.toString(),
                    explain_answer_vn: exercise.explain_answer_vn.toString()
                };
            }));
            // if (!newExercises?.length) {
            //     throw new Error(`Missing exercises or vocabularies for lesson ${stt}`);
            // }
            return await LessonService.createOrUpdate(
                null,
                title.trim(),
                description.trim(),
                Number(order),
                newExercises,
                vocabulary_ids,
                String(progress_id),
                "publish",
                Number(min_score) || 0
            );
        }));
        // Filter out null values from newLessons
        const filteredLessons = newLessons.filter((lesson: any) => lesson !== null);
        console.log(filteredLessons);
        if (filteredLessons.length === 0) {
            throw new HTTPException(400, { message: "Không có bài học nào được tạo" });
        }
        return newLessons;
    }
};