import { Hono } from 'hono';
import { asyncHandler } from '../utils/async_handler.util.js';
import { authenticate, authorizeAdmin } from '../middlewares/auth.middleware.js';
import { VocabularyController } from '../controllers/vocabulary.controller.js';

const app = new Hono();

// Create or update
app.post('/', authenticate, authorizeAdmin, asyncHandler(VocabularyController.createOrUpdate));
// Get all
app.get('/', authenticate, asyncHandler(VocabularyController.getAll));
// Get by id
app.get('/:vocabulary_id', authenticate, asyncHandler(VocabularyController.getById));
// // Delete
app.delete('/:vocabulary_id', authenticate, authorizeAdmin, asyncHandler(VocabularyController.deleteById));
// Get all by topic
app.get('/topic/:topic_id', authenticate, asyncHandler(VocabularyController.getAllByTopic));

export default app;