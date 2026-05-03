import { Router } from 'express';
import { submitCode, getSubmission, getUserSubmissions, submitProject } from '../controllers/submissionController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Code Submissions
router.post('/code', authenticateToken, submitCode);
router.get('/code/history', authenticateToken, getUserSubmissions);
router.get('/:id', authenticateToken, getSubmission);

// Project Submissions
router.post('/project', authenticateToken, submitProject);

export default router;
