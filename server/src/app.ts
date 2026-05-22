import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { sequelize } from './config/database';
import path from 'path';
import authRoutes from './routes/authRoutes';
import problemRoutes from './routes/problemRoutes';
import contestRoutes from './routes/contestRoutes';
import submissionRoutes from './routes/submissionRoutes';
import mistakeBookRoutes from './routes/mistakeBookRoutes';
import statsRoutes from './routes/statsRoutes';
import aiRoutes from './routes/aiRoutes';
import notificationRoutes from './routes/notificationRoutes';
import commentRoutes from './routes/commentRoutes';
import knowledgeRoutes from './routes/knowledgeRoutes';
import settingsRoutes from './routes/settingsRoutes';

const app = express();

// Trust Nginx reverse proxy
app.set('trust proxy', 1);

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev', {
    skip: (req, res) => req.method === 'GET' && res.statusCode < 400
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/mistakes', mistakeBookRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/settings', settingsRoutes);

// Basic Route
app.get('/', (req, res) => {
    res.json({ message: 'EduCode AI Backend API is running' });
});

// Database Sync (for dev)
// sequelize.sync().then(() => console.log('Database synced'));

export default app;
