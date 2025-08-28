import { Hono } from 'hono';
import { asyncHandler } from '../utils/async_handler.util.js';
import { TopicController } from '../controllers/topic.controller.js';
import { authenticate, authorizeAdmin } from '../middlewares/auth.middleware.js';

const app = new Hono();

// Create or update topic
app.post('/', authenticate, authorizeAdmin, asyncHandler(TopicController.createOrUpdate));
// Get all
app.get('/', asyncHandler(TopicController.getAll));
// Get by id
app.get('/:topic_id', authenticate, authorizeAdmin, asyncHandler(TopicController.getById));
// Delete
app.delete('/:topic_id', authenticate, authorizeAdmin, asyncHandler(TopicController.deleteById));

export default app;