import express from 'express';
import { getKnowledgeGraph, getStudentMastery, createKnowledgeNode } from '../controllers/knowledgeController';
import { authenticateToken, isAdmin } from '../middleware/authMiddleware';

const router = express.Router();

// Public/Student routes
router.get('/nodes', authenticateToken, getKnowledgeGraph);
router.get('/mastery', authenticateToken, getStudentMastery);

// Admin routes
router.post('/nodes', authenticateToken, isAdmin, createKnowledgeNode);

export default router;
