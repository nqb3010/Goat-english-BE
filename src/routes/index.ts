import { Hono } from 'hono';
import type { Context, Next } from "hono";
import userRouter from './user.route.js';
import authRouter from './auth.route.js';
import topicRouter from './topic.route.js';
import progressRouter from './progress.route.js';
import lessonRouter from './lesson.route.js';
import exerciseLevelRouter from './exercise_level.route.js';
import exerciseTypeRouter from './exercise_type.route.js';
import exerciseRouter from './exercise.route.js';
import vocabularyRouter from './vocabulary.route.js';
import adminRouter from './admin.route.js';

let chatStore = new Map<
  string,
  { content: string; timestamp: number }[]
>();
const app = new Hono();

// auth
app.route('/auth', authRouter);
// user
app.route('/user', userRouter);
// topic
app.route('/topic', topicRouter);
// progress
app.route('/progress', progressRouter);
// lesson
app.route('/lesson', lessonRouter);
// exercise
app.route('/exercise', exerciseRouter);
// exercise level
app.route('/exercise-level', exerciseLevelRouter);
// exercise type
app.route('/exercise-type', exerciseTypeRouter);
// vocabulary
app.route('/vocabulary', vocabularyRouter);
// admin
app.route('/admin', adminRouter);
// text to speech
app.post("/text-to-speech", async (c) => {
    const { text, lang } = await c.req.json()
    if (!text) return c.json({ error: "Missing text input" }, 400)
    // Tạo URL Google Translate TTS
    const googleTTSUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang || "en"}&client=tw-ob&q=${encodeURIComponent(text)}`
    // Gửi request với User-Agent giả mạo
    const response = await fetch(googleTTSUrl, {
        headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        },
    })
    if (!response.ok) {
        return c.json({ error: `Google TTS API error: ${response.status}` }, 500)
    }
    // Proxy dữ liệu về client
    const audioBuffer = await response.arrayBuffer()
    return new Response(audioBuffer, {
        headers: { "Content-Type": "audio/mpeg" },
    })
});
// translate
app.post("/translate", async (c) => {
    const key = process.env.TRANSLATE_API_KEY;
    const region = process.env.TRANSLATE_API_REGION;
    const enpoint = process.env.TRANSLATE_API_ENDPOINT;
    if (!key || !region || !enpoint) {
        return c.json({ error: "Missing environment variables" }, 500);
    }
    let { text, lang } = await c.req.json();
    if (!text) return c.json({ error: "Missing text input" }, 400);
    if (!lang) lang = "vi";
    const url = `${enpoint}/translate?api-version=3.0&from=en&to=${lang}`;
    console.log("translate", url, text, lang);
    // create uuid
    const uuid = crypto.randomUUID();
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Ocp-Apim-Subscription-Key": key,
            "Ocp-Apim-Subscription-Region": region,
            "Content-Type": "application/json",
            'X-ClientTraceId': uuid.toString(),
        },
        body: JSON.stringify([{ text }]),
    });
    if (!response.ok) {
        const errText = await response.text();
        return c.json({ error: `Azure Translator API error: ${response.status}`, detail: errText }, 500);
    }
    const data = await response.json();
    const translations = data.map((item: any) => item.translations[0].text);
    return c.json({ translations });
});

let OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_API_MODEL = process.env.OPENROUTER_API_MODEL || 'google/gemma-3n-e4b-it:free';
// chatbot
app.get("/chatbot", async (c: Context) => {
    const { message,user_id } = c.req.query();
    if (!message || typeof message !== 'string') {
        return new Response("Missing or invalid `message` query parameter", { status: 400 });
    }
    if (!user_id || typeof user_id !== 'string') {
        return new Response("Missing or invalid `user_id` query parameter", { status: 400 });
    }
    if (!chatStore.has(user_id)) {
        chatStore.set(user_id, []);
    }
    let history = chatStore.get(user_id)!;
    // Giữ lại tối đa 10 tin nhắn gần nhất
    if (history.length > 10) {
        history.shift();
    }
    // Xoá các tin nhắn cũ hơn 30 phút
    const THIRTY_MINUTES = 30 * 60 * 1000;
    const now = Date.now();
    history = history.filter((msg) => now - msg.timestamp < THIRTY_MINUTES);
    chatStore.set(user_id, history);
    // Kết hợp lịch sử thành một chuỗi
    const historyText = history.map((msg) => msg.content).join("\n");
    const fullMessage = `Dưới đây là lịch sử trò chuyện của người dùng:\n${historyText}\n\nCâu hỏi mới: ${message}\nTrả lời ngắn gọn, dễ hiểu.`;
    let aiResponse = "";
    const stream = new ReadableStream({
    async start(controller) {
        try {
            await fetchOpenRouterStream(
                fullMessage,
                (chunk) => {
                    aiResponse += chunk;
                    controller.enqueue(`data: ${chunk}\n\n`);
                },
                () => {
                    controller.enqueue(`data: [DONE]\n\n`);
                    controller.close();
                }
            );
            // Lưu tin nhắn mới vào lịch sử
            history.push({ content: `User: ${message}\nBạn đã trả lời: ${aiResponse}`, timestamp: Date.now() });
        } catch (err) {
            controller.enqueue(`data: [ERROR] ${err || "Unknown error"}\n\n`);
            controller.close();
        }
    },
    });
    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
        },
    });
});

export async function fetchOpenRouterStream(
    prompt: string,
    onChunk: (chunk: string) => void,
    onDone?: () => void,
    retryCount = 6,
    apiKeys: string[] = [process.env.OPENROUTER_API_KEY!, process.env.OPENROUTER_API_KEY_TWO!, process.env.OPENROUTER_API_KEY_THREE!],
    keyIndex = 0
) {
    const currentKey = apiKeys[keyIndex];
    if (!currentKey || currentKey.trim() === "") {
        throw new Error("Không tìm thấy API key hợp lệ để gọi OpenRouter.");
    }
    try {
        prompt = `Bạn là một trợ lý chuyên giúp người mới bắt đầu và người mất gốc học tiếng Anh. 
- Chỉ trả lời các câu hỏi liên quan đến học tiếng Anh cơ bản, giải thích ngắn gọn, dễ hiểu. 
- Nếu người dùng hỏi về nguồn gốc, ai tạo ra bạn, hay web này của ai thì trả lời ngắn gọn: "Tôi được phát triển bởi Bảo và đang được tích hợp vào website này để hỗ trợ học tiếng Anh."
Nếu người dùng chửi bậy, nói tục hoặc khiêu khích, bạn sẽ trả lời ngắn gọn là : "Thằng khốn, hỏi linh tinh tao band".
- Các câu hỏi ngoài phạm vi trên thì từ chối khéo: "Mình chỉ hỗ trợ học tiếng Anh cơ bản, bạn muốn hỏi gì về tiếng Anh không?"` + prompt;
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${currentKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: OPENROUTER_API_MODEL,
                stream: true,
                messages: [
                    { role: "user", content: prompt }
                ],
            }),
        });
        const isRateLimited = response.status === 429;
        const shouldRetry = retryCount > 0 && keyIndex + 1 < apiKeys.length;

        if ((!response.ok || isRateLimited) && shouldRetry) {
            console.warn(`Rate limit exceeded or request failed with status ${response.status}. Retrying with next key...`);
            await new Promise((res) => setTimeout(res, 2000));
            return fetchOpenRouterStream(prompt, onChunk, onDone, retryCount - 1, apiKeys, keyIndex + 1);
        } else if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            console.error("Fetch failed:", errorData || await response.text());
            throw new Error("OpenRouter API failed with status " + response.status);
        }
        // if (response.status === 429 && retryCount > 0 && keyIndex + 1 < apiKeys.length) {
        //     console.warn(`Rate limit exceeded for key ${keyIndex}. Trying next key in 2s...`);
        //     await new Promise((res) => setTimeout(res, 2000));
        //     return fetchOpenRouterStream(prompt, onChunk, onDone, retryCount - 1, apiKeys, keyIndex + 1);
        // }
        console.log("OpenRouter response status:", response.status, currentKey);

        // if (!response.ok) {
        //     const errorText = await response.text();
        //     throw new Error(`OpenRouter API error: ${errorText}`);
        // }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
            const { value, done } = await reader!.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split("\n");
            buffer = lines.pop() || ""; // giữ lại phần chưa hoàn chỉnh

            for (const line of lines) {
                if (!line.startsWith("data: ")) continue;

                const jsonStr = line.slice(6).trim();
                if (jsonStr === "[DONE]") {
                    onDone?.();
                    return;
                }
                try {
                    const parsed = JSON.parse(jsonStr);
                    const content = parsed?.choices?.[0]?.delta?.content;
                    if (content) {
                        onChunk(content);
                    }
                } catch (err) {
                    // Bỏ qua nếu dòng không parse được (vì chưa đầy đủ)
                    console.warn("Bỏ qua dòng JSON chưa hợp lệ:", jsonStr);
                }
            }
        }

    } catch (error) {
        console.error("Lỗi khi stream OpenRouter:", error);
        throw error;
    }
}

export default app;