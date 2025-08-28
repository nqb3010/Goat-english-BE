import { Hono } from 'hono';
import { asyncHandler } from '../utils/async_handler.util.js';
import { ExerciseTypeController } from '../controllers/exercise_type.controller.js';
import { authenticate, authorizeAdmin } from '../middlewares/auth.middleware.js';

const app = new Hono();

app.get('/ping', (c: any) => c.text("PING ExerciseType API"));
// Create ExerciseLevelController
app.post('/', authenticate, authorizeAdmin, asyncHandler(ExerciseTypeController.create));
app.get('/', asyncHandler(ExerciseTypeController.getAll));

export default app;