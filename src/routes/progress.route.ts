import { Hono } from 'hono';
import { asyncHandler } from '../utils/async_handler.util.js';
import { ProgressController } from '../controllers/progress.controller.js';
import { authenticate, authorizeAdmin } from '../middlewares/auth.middleware.js';

const app = new Hono();

// get progress
app.get('/', asyncHandler(ProgressController.getAll));
// Create or update progress
app.post('/', authenticate, authorizeAdmin, asyncHandler(ProgressController.createOrUpdate));
// Get progress by id
app.get('/:progress_id', asyncHandler(ProgressController.getById));
// Get all progress by topic
app.get('/topic/:topic_id', asyncHandler(ProgressController.getAllByTopic));
// Delete progress
app.delete('/:progress_id', authenticate, authorizeAdmin, asyncHandler(ProgressController.deleteById));

export default app;