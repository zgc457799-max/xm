import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Only TEACHER or ADMIN can manage system settings
router.use(authenticateToken);
router.use((req: any, res, next) => {
    if (req.user && (req.user.role === 'TEACHER' || req.user.role === 'ADMIN')) {
        next();
    } else {
        res.status(403).json({ message: '暂无权限访问系统设置' });
    }
});

router.get('/', getSettings);
router.post('/', updateSettings);

export default router;
