import { Hono, type Context } from 'hono';
import { asyncHandler } from '../utils/async_handler.util.js';
import { LessonController } from '../controllers/lesson.controller.js';
import LessonModel from '../models/lesson.model.js';
import { authenticate, authorizeAdmin } from '../middlewares/auth.middleware.js';
// import { openai } from '../app.js';

const app = new Hono();

app.get('/ping', (c: any) => c.text("PING LESSON API"));
// Get all lesson
app.get('/', asyncHandler(LessonController.getAll));
// Create Lesson or Update Lesson
app.post('/', authenticate, authorizeAdmin, asyncHandler(LessonController.createOrUpdate));
// Get lesson detail
app.get('/:lesson_id', asyncHandler(LessonController.getDetail));
// delete lesson
app.delete('/:lesson_id', authenticate, authorizeAdmin, asyncHandler(LessonController.deleteLesson));
// import lesson
app.post('/import', asyncHandler(LessonController.importLesson));

// test openai
// API tạo bài tập
// app.post('/generate-exercise', async (c) => {
//     try {
//       const { type, word } = await c.req.json<{ type: string; word: string }>();
//       if (!type || !word) return c.json({ error: 'Missing type or word' }, 400);
//       // Tạo prompt tương ứng
//       const prompts: Record<string, string> = {
//         fill_blank: `Create a fill-in-the-blank exercise using the word '${word}'. Return JSON: { "type": "fill_blank", "question": "...", "answer": "..." }`,
//         mcq: `Create a multiple-choice question for the word '${word}', with 4 answer choices, only one correct. Return JSON: { "type": "mcq", "question": "...", "options": ["A", "B", "C", "D"], "answer": "..." }`,
//         rewrite: `Rewrite this sentence using the word '${word}'. Return JSON: { "type": "rewrite", "original": "...", "rewritten": "..." }`,
//       };
//       if (!prompts[type]) return c.json({ error: 'Invalid exercise type' }, 400);
//       // Gọi OpenAI API
//       const response = await openai.chat.completions.create({
//         model: 'gpt-4',
//         response_format: {
//             "type": "json_object"
//         },
//         messages: [{ role: 'user', content: prompts[type] }],
//       });
//       if (!response.choices || response.choices.length === 0) {
//         return c.json({ error: "No response from OpenAI" }, 500);
//       }
//       // OpenAI đã trả về JSON hợp lệ, không cần parse
//       const data = response.choices[0].message.content;
//       return c.json(data);
//     } catch (error) {
//         console.error("❌ Lỗi server:", error);
//         return c.json({ error: "Internal Server Error" }, 500);
//     }
// });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

app.post('/generate', async (c) => {
  try {
    const { prompt } = await c.req.json<{ prompt: string }>();
    if (!prompt) {
      return c.json({ error: 'Missing prompt' }, 400);
    }
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-7b-instruct',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
      }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${errorText}`);
    }
    const data = await response.json();
    return c.json(data);
  } catch (error) {
    console.error('Lỗi khi gọi OpenRouter:', error);
    return c.json({ error: 'Lỗi khi gọi OpenRouter API' }, 500);
  }
});

export default app;