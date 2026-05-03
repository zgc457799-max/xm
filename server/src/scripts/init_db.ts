
import { sequelize } from '../config/database';
import Notification from '../models/Notification';
import Comment from '../models/Comment';
import Problem from '../models/Problem';
import User from '../models/User';
import StudentStats from '../models/StudentStats';
import CodingSubmission from '../models/CodingSubmission';
import Contest from '../models/Contest';
import ProblemBank from '../models/ProblemBank';
import ContestProblem from '../models/ContestProblem';
import ContestRegistration from '../models/ContestRegistration';
import ContestResult from '../models/ContestResult';
import ProjectSubmission from '../models/ProjectSubmission';

const initDB = async () => {
    try {
        console.log('Syncing database...');

        // Define associations if any (though currently models seem independent or manually managed)

        // Sync models
        await Notification.sync({ alter: true });
        console.log('Notifications table synced.');

        await Comment.sync({ alter: true });
        console.log('Comments table synced.');

        await StudentStats.sync({ alter: true });
        console.log('StudentStats table synced.');

        await CodingSubmission.sync({ alter: true });
        console.log('CodingSubmission table synced.');

        await Problem.sync({ alter: true });
        console.log('Problem table synced.');

        await Contest.sync({ alter: true });
        console.log('Contest table synced.');

        await ProblemBank.sync({ alter: true });
        console.log('ProblemBank table synced.');

        await ContestProblem.sync({ alter: true });
        console.log('ContestProblem table synced.');

        await ContestRegistration.sync({ alter: true });
        console.log('ContestRegistration table synced.');

        await ContestResult.sync({ alter: true });
        console.log('ContestResult table synced.');

        await ProjectSubmission.sync({ alter: true });
        console.log('ProjectSubmission table synced.');

        console.log('Database sync complete.');
        process.exit(0);
    } catch (error) {
        console.error('Unable to sync database:', error);
        process.exit(1);
    }
};

initDB();
