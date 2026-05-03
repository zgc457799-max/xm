
import { sequelize } from '../config/database';
import User from '../models/User';
import StudentMastery from '../models/StudentMastery';
import KnowledgeNode from '../models/KnowledgeNode';

const seedMastery = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Find a student (or all students)
        const students = await User.findAll({ where: { role: 'STUDENT' } });
        const nodes = await KnowledgeNode.findAll();

        if (students.length === 0) {
            console.log('No students found.');
            return;
        }

        console.log(`Seeding mastery for ${students.length} students...`);

        for (const student of students) {
            console.log(`Processing student: ${student.name} (${student.id})`);

            for (const node of nodes) {
                // 70% chance to have some mastery
                if (Math.random() > 0.3) {
                    const score = Math.floor(Math.random() * 60) + 20; // 20-80 score
                    const attempts = Math.floor(Math.random() * 10) + 1;
                    const correct = Math.floor(attempts * (score / 100));

                    await StudentMastery.upsert({
                        user_id: student.id,
                        node_id: node.id,
                        mastery_score: score,
                        total_attempts: attempts,
                        correct_count: correct,
                        last_updated: new Date()
                    });
                }
            }
        }

        console.log('Mastery data seeded!');
        process.exit(0);

    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedMastery();
