import { Hono, type Context } from 'hono';
import { asyncHandler } from '../utils/async_handler.util.js';
import { ExamController } from '../controllers/exam.controller.js';
import { authenticate, authorizeAdmin } from '../middlewares/auth.middleware.js';
const app = new Hono();
app.get('/ping', (c: any) => c.text("PING EXAM API"));
// Create or Update exam
app.post('/', authenticate, authorizeAdmin, asyncHandler(ExamController.createOrUpdate));
// Get exam detail
app.get('/:exam_id', asyncHandler(ExamController.getDetail));
// Get all exams
app.get('/', asyncHandler(ExamController.getAll));
// // Delete exam
// app.delete('/:exam_id', authenticate, authorizeAdmin, asyncHandler(ExamController.deleteExam));
// // Import exam
// app.post('/import', authenticate, authorizeAdmin, asyncHandler(ExamController.importExam));
export default app;