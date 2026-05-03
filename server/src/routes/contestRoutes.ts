import { Router } from 'express';
import { getContests, getContestById, createContest, updateContest, deleteContest, registerContest, unregisterStudent, submitProject, addProblemToContest, settleContest, getMyContestResult, publishResults, getProjectSubmissions, gradeProjectSubmission, submitContestExam, getContestLeaderboard } from '../controllers/contestController';
import { authenticateToken } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure Multer Storage
// Configure Multer Storage
const storage = multer.diskStorage({
    destination: (req: any, file: any, cb: any) => {
        // Use path.resolve to match the project root structure more reliably
        // Assuming this file is in src/routes, we go up two levels to server, then to uploads
        const uploadPath = path.resolve(__dirname, '../../uploads/submissions');
        console.log('[DEBUG] Multer Destination:', uploadPath);

        if (!fs.existsSync(uploadPath)) {
            console.log('[DEBUG] Creating directory:', uploadPath);
            try {
                fs.mkdirSync(uploadPath, { recursive: true });
            } catch (err) {
                console.error('[DEBUG] Error creating directory:', err);
            }
        }
        cb(null, uploadPath);
    },
    filename: (req: any, file: any, cb: any) => {
        console.log('[DEBUG] Multer Filename for:', file.fieldname);

        let originalName = file.originalname;
        try {
            // Fix encoding for Chinese characters in headers
            originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        } catch (e) { }

        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E5);
        // Format: {timestamp}-{random}-{originalname}
        const filename = `${uniqueSuffix}-${originalName}`;
        console.log('[DEBUG] Generated filename:', filename);
        cb(null, filename);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

const projectUpload = upload.fields([
    { name: 'code', maxCount: 1 },
    { name: 'doc', maxCount: 1 }
]);

const router = Router();

router.get('/', authenticateToken, getContests);
router.get('/:id', authenticateToken, getContestById);
router.post('/', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), createContest);
router.put('/:id', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), updateContest);
router.delete('/:id', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), deleteContest);

router.post('/:id/register', authenticateToken, registerContest);
router.post('/:id/submit-exam', authenticateToken, submitContestExam);
router.delete('/:id/register/:userId', authenticateToken, unregisterStudent);
router.post('/:id/submit-project', authenticateToken, projectUpload, submitProject);
router.post('/:id/problems', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), addProblemToContest);
router.post('/:id/settle', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), settleContest);
router.post('/:id/publish', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), publishResults);
router.get('/:id/my-result', authenticateToken, getMyContestResult);
router.get('/:id/leaderboard', authenticateToken, getContestLeaderboard);

// Project Grading
router.get('/:id/project-submissions', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), getProjectSubmissions);
router.put('/:id/grade/:userId', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), gradeProjectSubmission);

export default router;
