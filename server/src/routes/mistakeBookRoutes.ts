import express from 'express';
import { addToMistakeBook, removeFromMistakeBook, getMistakeBook } from '../controllers/mistakeBookController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

router.use(authenticateToken); // Protect all routes

router.get('/', getMistakeBook);
router.post('/', addToMistakeBook);
router.delete('/:problemId', removeFromMistakeBook);

export default router;
