import { Request, Response } from 'express';
import StudentStats from '../models/StudentStats';
import { Op } from 'sequelize';

export const getStudentStats = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.id;

        const [stats, created] = await StudentStats.findOrCreate({
            where: { user_id: userId },
            defaults: {
                user_id: userId,
                solved_count: 0,
                total_submissions: 0,
                accuracy_rate: 0,
                streak_days: 0,
                rank_score: 0
            }
        });

        // Calculate rank
        const rank = await StudentStats.count({
            where: {
                rank_score: { [Op.gt]: stats.rank_score }
            }
        }) + 1;

        const result = stats.toJSON() as any;
        result.rank = rank;

        res.json(result);
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const dailyCheckIn = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.id;

        const [stats] = await StudentStats.findOrCreate({
            where: { user_id: userId },
            defaults: { user_id: userId, solved_count: 0, total_submissions: 0, accuracy_rate: 0, streak_days: 0, rank_score: 0 }
        });

        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const todayLocal = new Date(todayStr + 'T00:00:00Z');

        const lastCheckIn = stats.last_check_in ? new Date(stats.last_check_in) : null;
        if (lastCheckIn) {
            const lastStr = lastCheckIn.toISOString().split('T')[0];
            const lastLocal = new Date(lastStr + 'T00:00:00Z');
            
            // Check if already checked in today
            if (lastLocal.getTime() === todayLocal.getTime()) {
                return res.status(400).json({ message: '今日已打卡' });
            }

            // Check streak continuity (yesterday)
            const yesterdayLocal = new Date(todayLocal);
            yesterdayLocal.setUTCDate(yesterdayLocal.getUTCDate() - 1);

            let newStreak = stats.streak_days;
            if (lastLocal.getTime() === yesterdayLocal.getTime()) {
                newStreak += 1;
            } else {
                newStreak = 1;
            }

            await stats.update({
                streak_days: newStreak,
                last_check_in: new Date()
            });
            return res.json({ message: '打卡成功', streak: newStreak });
        } else {
            // First time check-in
            const newStreak = 1;
            await stats.update({
                streak_days: newStreak,
                last_check_in: new Date()
            });
            return res.json({ message: '首次打卡成功', streak: newStreak });
        }

    } catch (error) {
        console.error('Check-in error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Teacher Dashboard Extended Stats
import ContestRegistration from '../models/ContestRegistration';
import Problem from '../models/Problem';
import CodingSubmission from '../models/CodingSubmission';
import User from '../models/User';

export const getTeacherStats = async (req: Request, res: Response) => {
    try {
        // 1. Problem Difficulty Distribution
        const problems = await Problem.findAll({
            attributes: ['difficulty']
        });

        const difficultyDist = {
            Easy: 0,
            Medium: 0,
            Hard: 0
        };

        problems.forEach(p => {
            if (p.difficulty === 'Easy') difficultyDist.Easy++;
            else if (p.difficulty === 'Medium') difficultyDist.Medium++;
            else if (p.difficulty === 'Hard') difficultyDist.Hard++;
        });

        // 2. Recent Activity (Submissions)
        const recentSubmissions = await CodingSubmission.findAll({
            limit: 10,
            order: [['submitted_at', 'DESC']]
        });

        // 3. Manual Join for User Info (safer without global model associations)
        const userIds = [...new Set(recentSubmissions.map(s => s.user_id))];
        const users = await User.findAll({
            where: { id: userIds },
            attributes: ['id', 'name', 'avatar_url']
        });

        const userMap = new Map();
        users.forEach(u => userMap.set(u.id, u));

        const activity = recentSubmissions.map(s => {
            const u = userMap.get(s.user_id);
            return {
                id: s.id,
                user_id: s.user_id,
                user_name: u ? u.name : 'Unknown',
                user_avatar: u ? u.avatar_url : null,
                problem_id: s.problem_id,
                status: s.status,
                score: s.score,
                submitted_at: s.submitted_at
            };
        });

        res.json({
            difficultyDist,
            recentActivity: activity
        });

    } catch (error) {
        console.error("Get teacher stats error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};
export const getContestAnalytics = async (req: Request, res: Response) => {
    try {
        const { contestId } = req.params;
        // Basic Leaderboard Logic reusing similar logic from Contest settlement
        // Fetch all submissions for this contest that are AC
        const submissions = await CodingSubmission.findAll({
            where: {
                contest_id: contestId,
                status: 'AC'
            }
        });

        // Get Participants
        const participants = await ContestRegistration.findAll({ where: { contest_id: contestId } });
        const userIds = participants.map(p => p.user_id);
        const users = await User.findAll({ where: { id: userIds }, attributes: ['id', 'name'] });
        const userMap = new Map();
        users.forEach(u => userMap.set(u.id, u.name));

        const userStats: Record<string, { solved: Set<string>, time: number }> = {};
        userIds.forEach(uid => { userStats[uid] = { solved: new Set(), time: 0 }; });

        submissions.forEach(sub => {
            // In a real generic analytics, we might want to sum score/weights, but count is fine for simple view
            if (userStats[sub.user_id]) {
                userStats[sub.user_id].solved.add(sub.problem_id);
                // Time calculation could be added here if needed
            }
        });

        const leaderboard = userIds.map((uid, index) => {
            const solvedCount = userStats[uid] ? userStats[uid].solved.size : 0;
            return {
                rank: 0, // Calculated after sort
                name: userMap.get(uid) || '未知学生',
                solved: solvedCount,
                time: 'N/A' // Placeholder
            };
        }).sort((a, b) => b.solved - a.solved);

        // Assign Rank
        leaderboard.forEach((item, idx) => item.rank = idx + 1);

        res.json({ leaderboard });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching analytics' });
    }
};

export const getStudentRadar = async (req: Request, res: Response) => {
    try {
        const { studentId } = req.params;

        // Fetch student's correct submissions
        const submissions = await CodingSubmission.findAll({
            where: { user_id: studentId, status: 'AC' }
        });

        const problemIds = submissions.map(s => s.problem_id);
        const problems = await Problem.findAll({
            where: { id: problemIds },
            attributes: ['tags']
        });

        // Calculate tag frequency or "score"
        const tagStats: Record<string, number> = {};
        problems.forEach(p => {
            if (p.tags && Array.isArray(p.tags)) {
                p.tags.forEach(tag => {
                    tagStats[tag] = (tagStats[tag] || 0) + 20; // +20 points per problem for that tag
                });
            }
        });

        // Transform to radar format
        const radarData = Object.keys(tagStats).map(subject => ({
            subject,
            A: Math.min(tagStats[subject], 150), // Cap at 150
            fullMark: 150
        })).slice(0, 6); // Limit to top 6 tags

        // Default if empty
        if (radarData.length === 0) {
            radarData.push({ subject: '综合', A: 50, fullMark: 150 });
        }

        res.json(radarData);

    } catch (error) {
        res.status(500).json({ message: 'Error fetching radar data' });
    }
};
