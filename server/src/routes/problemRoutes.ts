import { Router } from 'express';
import { getBanks, createBank, updateBank, deleteBank, getProblems, getProblemById, createProblem, updateProblem, deleteProblem, validateProblem } from '../controllers/problemController';
import { authenticateToken } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';

const router = Router();

// Public or Protected? Let's assume protected for now or public for Students
// Ideally, GET is public/student, POST/PUT is teacher.

router.get('/banks', authenticateToken, getBanks);
router.post('/banks', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), createBank);
router.put('/banks/:id', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), updateBank);
router.delete('/banks/:id', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), deleteBank);

router.get('/', authenticateToken, getProblems);
router.get('/:id', authenticateToken, getProblemById);
router.post('/', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), createProblem);
router.post('/validate', authenticateToken, validateProblem);
router.put('/:id', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), updateProblem);
router.delete('/:id', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), deleteProblem);

export default router;
