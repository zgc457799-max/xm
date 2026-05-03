import express from 'express';
import { getStudentStats, dailyCheckIn, getTeacherStats, getContestAnalytics, getStudentRadar } from '../controllers/statsController';
import { authenticateToken } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';

const router = express.Router();

router.use(authenticateToken); // Protect routes

router.get('/mine', getStudentStats);
router.post('/checkin', dailyCheckIn);
router.get('/teacher', authorizeRoles('TEACHER', 'ADMIN'), getTeacherStats);
router.get('/contest/:contestId', authorizeRoles('TEACHER', 'ADMIN'), getContestAnalytics);
router.get('/student/:studentId/radar', getStudentRadar);

export default router;
