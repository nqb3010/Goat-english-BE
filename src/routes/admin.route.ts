import { Hono } from 'hono';
import { asyncHandler } from '../utils/async_handler.util.js';
import { authenticate, authorizeAdmin } from '../middlewares/auth.middleware.js';
import { AdminController } from '../controllers/admin.controller.js';

const app = new Hono();

// get data dashboard
app.get('/dashboard', authenticate, authorizeAdmin, asyncHandler(AdminController.getData));
// get data report
app.get('/report', authenticate, authorizeAdmin, asyncHandler(AdminController.getReport));

export default app;