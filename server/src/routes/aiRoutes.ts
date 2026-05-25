import { Router } from 'express';
import {
    analyzeProblem,
    getHint,
    analyzeError,
    getFlowchart,
    parseProblem,
    genTestCases,
    genCertificateBg,
    genReferenceCode,
    parseBatchProblems,
    getTtsAudio
} from '../controllers/aiController';
import { authenticateToken } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';

const router = Router();

// Protect all AI routes
router.use(authenticateToken);

// Student Routes
router.post('/analyze', analyzeProblem);
router.post('/hint', getHint);
router.post('/debug', analyzeError);
router.post('/flowchart', getFlowchart);
router.post('/tts', getTtsAudio);

// Teacher Routes (Ideally add role check middleware here too)
router.post('/parse-problem', authorizeRoles('TEACHER', 'ADMIN'), parseProblem);
router.post('/parse-batch', authorizeRoles('TEACHER', 'ADMIN'), parseBatchProblems);
router.post('/generate-cases', authorizeRoles('TEACHER', 'ADMIN'), genTestCases);
router.post('/generate-certificate', authorizeRoles('TEACHER', 'ADMIN'), genCertificateBg);
router.post('/generate-code', authorizeRoles('TEACHER', 'ADMIN'), genReferenceCode);

export default router;
