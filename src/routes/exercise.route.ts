import { Hono } from 'hono';
import { asyncHandler } from '../utils/async_handler.util.js';
import { ExerciseController } from '../controllers/exercise.controller.js';
import { authenticate, authorizeAdmin } from '../middlewares/auth.middleware.js';

const app = new Hono();
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

app.get('/ping', (c: any) => c.text("PING Exercise API"));
// Create Exercise
app.post('/', authenticate, authorizeAdmin, asyncHandler(ExerciseController.create));

// Hàm gọi OpenRouter và xử lý retry khi gặp lỗi 429
async function fetchOpenRouter(prompt: string, retryCount = 3): Promise<any> {
    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'meta-llama/llama-3.1-8b-instruct:free',
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' }
            }),
        });
        if (response.status === 429 && retryCount > 0) {
            console.warn('Rate limit exceeded. Retrying in 2s...');
            await new Promise(res => setTimeout(res, 2000)); // Đợi 2 giây rồi thử lại
            return fetchOpenRouter(prompt, retryCount - 1);
        }
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenRouter API error: ${errorText}`);
        }
        const data = await response.json();
        if (data && data.choices?.[0]?.finish_reason === "stop") {
            const messageContent = extractJSON(data.choices[0].message.content);
            return { data, messageContent };
        }
    } catch (error) {
        console.error('Lỗi khi gọi OpenRouter:', error);
        throw error;
    }
}

function extractJSON(responseText: string) {
    const match = responseText.match(/\{[\s\S]*\}/); // Tìm đoạn JSON trong chuỗi
    if (match) {
        try {
            return JSON.parse(match[0]); // Chuyển chuỗi JSON thành object
        } catch (error) {
            console.error("Lỗi phân tích JSON:", error);
        }
    }
    return null; // Trả về null nếu không tìm thấy JSON hợp lệ
}

// Route xử lý tạo bài tập
app.post('/generate-exercise', async (c) => {
    try {
        const { type, word } = await c.req.json<{ type: string; word: string }>();
        if (!type || !word) {
            return c.json({ error: 'Thiếu type hoặc word' }, 400);
        }
        let prompt = '';
        switch (type) {
            case 'fill_blank':
                prompt = `Tạo bài tập điền vào chỗ trống với từ '${word}', để học tiếng Anh. Trả về JSON hợp lệ, không kèm bất kỳ văn bản nào khác:
                    {
                    "type": "fill_blank",
                    "question": "Câu có chứa từ cần điền...",
                    "answer": "Từ cần điền"
                    }`;
                break;

            case 'mcq':
                prompt = `
                    Create a multiple choice test on English vocabulary in the field of information technology.
                    - Vocabulary: "${word}"
                    - Question: "Choose the correct meaning of the word '${word}'"
                    - The answer is the closest meaning to the vocabulary, not written in sentences or paragraphs. For example: "computer" -> "computer", "value" -> "value".
                    - There are 4 answers in Vietnamese or English, and only 1 answer is correct.
                    - If the vocabulary is in English, the answer will be the Vietnamese meaning and vice versa.
                    - Returns valid JSON, without any other text:
                    {
                    "type": "mcq",
                    "word": "${word}",
                    "question": "Choose the correct meaning of the word '${word}'",
                    "options": ["Incorrect meaning 1", "Incorrect meaning 2", "Incorrect meaning 3", "Correct answer"],
                    "answer": "Correct answer"
                    }
                `;
                break;

            case 'sentence_order':
                prompt = `Tạo bài tập sắp xếp từ thành câu hoàn chỉnh có chứa từ '${word}', để học tiếng Anh. Trả về JSON hợp lệ, không kèm bất kỳ văn bản nào khác:
                    {
                    "type": "sentence_order",
                    "words": ["Từ 1", "Từ 2", "Từ 3", "Từ 4", "..."],
                    "answer": "Câu hoàn chỉnh"
                    }`;
                break;

            case 'match_meaning':
                prompt = `Tạo bài tập ghép nghĩa, yêu cầu người Việt nối từ '${word}' với nghĩa đúng. Trả về JSON hợp lệ, không kèm bất kỳ văn bản nào khác:
                    {
                    "type": "match_meaning",
                    "word": "${word}",
                    "options": ["Nghĩa sai 1", "Nghĩa sai 2", "Nghĩa sai 3", "Nghĩa đúng"],
                    "answer": "Nghĩa đúng"
                    }`;
                break;

            case 'listen_fill':
                prompt = `Tạo bài tập nghe và điền từ vào chỗ trống có chứa từ '${word}', để học tiếng Anh. Trả về JSON hợp lệ, không kèm bất kỳ văn bản nào khác:
                    {
                    "type": "listen_fill",
                    "audio": "URL của file âm thanh",
                    "question": "Câu có từ cần điền vào chỗ trống...",
                    "answer": "Từ cần điền"
                    }`;
                break;

            default:
                return c.json({ error: 'Loại bài tập không hợp lệ' }, 400);
        }
        const result = await fetchOpenRouter(prompt);
        return c.json(result);
    } catch (error) {
        return c.json({ error: 'Lỗi khi tạo bài tập' }, 500);
    }
});

export default app;