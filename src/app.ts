import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { poweredBy } from 'hono/powered-by';
import { secureHeaders } from 'hono/secure-headers';
import { compress } from 'hono/compress';
import { v2 as cloudinary } from 'cloudinary';
import OpenAI from 'openai';

import routers from './routes/index.js';

import instanceMongoDb from './db/mongo.js';

const app = new Hono();
// export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

app.get("/", (c) => {
    return c.text("Hello from Hono on Vercel!");
});

// Middleware
app.use('*', poweredBy()); // Tương tự helmet (thêm header X-Powered-By)
app.use('*', logger()); // Thay thế morgan
app.use('*', secureHeaders()); // Tương tự helmet
app.use('*', compress()); // Tương tự compression
app.use('*', cors()); // CORS

// connect db
instanceMongoDb.getConnection();

// router
app.route('/api', routers);

// config cloudinary
cloudinary.config({ 
    cloud_name: process.env.CLOUD_NAME, 
    api_key: process.env.CLOUD_API_KEY, 
    api_secret: process.env.CLOUD_API_SECRET,
    secure: true,
});

// connect openai
// async function testOpenAI() {
//     try {
//         const response = await openai.chat.completions.create({
//             model: 'gpt-4o',
//             messages: [{ role: 'user', content: 'Hello, how are you?' }]
//         });
//         console.log('✅ OpenAI response:', response.choices[0].message.content);
//     } catch (error) {
//         console.error('❌ OpenAI connection failed:', error);
//     }
// }
  
// testOpenAI();

export default app;
