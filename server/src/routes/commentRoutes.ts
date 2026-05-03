import { Router } from 'express';
import { getComments, addComment, deleteComment, toggleCommentLike } from '../controllers/commentController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/:problemId', authenticateToken, getComments);
router.post('/:problemId', authenticateToken, addComment);
router.post('/:id/like', authenticateToken, toggleCommentLike);
router.delete('/:id', authenticateToken, deleteComment);

export default router;
