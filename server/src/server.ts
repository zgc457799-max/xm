import dotenv from 'dotenv';
import app from './app';
import { sequelize } from './config/database';

dotenv.config();

import http from 'http';
import socketService from './services/socketService';

const PORT = process.env.PORT || 3001;

async function startServer() {
    try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');

        // Setup Associations
        const { setupAssociations } = require('./models/associations');
        setupAssociations();

        // Sync database schema (Disabled alter: true temporarily to bypass ER_TOO_MANY_KEYS bug)
        await sequelize.sync();
        console.log('Database schema synchronized.');

        const server = http.createServer(app);

        // Initialize Socket.io
        socketService.init(server);

        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

startServer();
