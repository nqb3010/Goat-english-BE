import { Hono } from 'hono';
import { asyncHandler } from '../utils/async_handler.util.js';
import { ExerciseLevelController } from '../controllers/exercise_level.controller.js';
import { authenticate, authorizeAdmin } from '../middlewares/auth.middleware.js';

const app = new Hono();

app.get('/ping', (c: any) => c.text("PING ExerciseLevel API"));
// Create ExerciseLevelController
app.post('/', authenticate, authorizeAdmin, asyncHandler(ExerciseLevelController.create));
app.get('/', asyncHandler(ExerciseLevelController.getAll));

export default app;