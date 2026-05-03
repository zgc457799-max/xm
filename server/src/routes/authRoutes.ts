import { Router } from 'express';
import { login, register, getMe, getAllStudents, changePassword, createStudent, updateStudent, deleteStudent } from '../controllers/authController';
import { authenticateToken } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';

import rateLimit from 'express-rate-limit';

const router = Router();

// Login rate limiter: max 5 attempts per minute per IP
const loginLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 5,
    message: { message: '登录过于频繁，请1分钟后再试' },
    standardHeaders: true,
    legacyHeaders: false,
});

router.post('/login', loginLimiter, login);
router.post('/register', register);
router.get('/me', authenticateToken, getMe);
router.get('/students', authenticateToken, getAllStudents);
router.post('/change-password', authenticateToken, changePassword);

// Student CRUD (Teacher)
router.post('/students', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), createStudent);
router.put('/students/:id', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), updateStudent);
router.delete('/students/:id', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), deleteStudent);

export default router;
