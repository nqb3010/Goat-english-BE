import { Hono } from 'hono';
import { UserController } from '../controllers/user.controller.js';
import { asyncHandler } from '../utils/async_handler.util.js';
import { authenticate, authorizeAdmin } from "../middlewares/auth.middleware.js";
import { emailSchema } from '../validators/auth.validator.js';
import { validate } from '../middlewares/validate.middleware.js';

const app = new Hono();

// Create or update user
app.post('/', authenticate, authorizeAdmin, validate(emailSchema), asyncHandler(UserController.createOrUpdate));
// get all user
app.get('/', authenticate, authorizeAdmin, asyncHandler(UserController.getAll));
// get infor user
app.get('/get-info', authenticate, asyncHandler(UserController.getInfo));
// change topic current
app.post('/change-topic', authenticate, asyncHandler(UserController.changeTopic));
// get topic đã học
app.get('/get-topics-learned', authenticate, asyncHandler(UserController.getTopicsLearned));
// get lesson hiện tại
app.get('/get-lesson-current/:topic_id', authenticate, asyncHandler(UserController.getLessonCurrent));
// submit lesson
app.post('/submit-lesson', authenticate, asyncHandler(UserController.submitLesson));
// Get by id
app.get('/:user_id', authenticate, authorizeAdmin, asyncHandler(UserController.getById));
// Delete
app.delete('/:user_id', authenticate, authorizeAdmin, asyncHandler(UserController.deleteById));
// Get old mistake
app.get('/get-old-mistake/:user_id/:topic_id', authenticate, asyncHandler(UserController.getOldMistake));
// update infor user
app.post('/update-infor', authenticate, asyncHandler(UserController.updateInfor));
// change-password
app.post('/change-password', authenticate, asyncHandler(UserController.changePassword));
// delete account
app.post('/delete-account', authenticate, asyncHandler(UserController.deleteAccount));
// check streak
app.post('/check-streak', authenticate, asyncHandler(UserController.checkStreak));

export default app;