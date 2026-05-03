import { Request, Response } from 'express';
import Contest from '../models/Contest';
import ContestRegistration from '../models/ContestRegistration';
import ContestProblem from '../models/ContestProblem';
import Problem from '../models/Problem';
import ContestResult from '../models/ContestResult';
import CodingSubmission from '../models/CodingSubmission';
import ProjectSubmission from '../models/ProjectSubmission';
import User from '../models/User';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

// Helper to transform contest to frontend format
const transformContest = (contest: Contest) => {
    const raw = contest.toJSON() as any;

    // Map database field names to frontend expected camelCase names
    raw.startTime = raw.start_time;
    raw.endTime = raw.end_time;
    raw.isLeaderboardOpen = raw.is_leaderboard_open;
    raw.certificateConfig = raw.certificate_config;
    raw.createdAt = raw.created_at;

    // Dynamic Status Calculation
    const now = new Date();
    const start = new Date(raw.start_time);
    const end = new Date(raw.end_time);

    if (now < start) {
        raw.status = 'UPCOMING';
    } else if (now >= start && now <= end) {
        raw.status = 'LIVE';
    } else {
        raw.status = 'ENDED';
    }

    return raw;
};

// Get Contests
export const getContests = async (req: Request | any, res: Response) => {
    try {
        const contests = await Contest.findAll();
        const userId = req.user?.id;

        // Enrich with registration and problem info for teacher management
        const enrichedContests = await Promise.all(contests.map(async (c) => {
            const raw = transformContest(c);

            // Get registrations
            const registrations = await ContestRegistration.findAll({ where: { contest_id: c.id } });
            raw.registeredStudentIds = registrations.map(r => r.user_id);
            raw.participantCount = registrations.length;

            // Personal registration status
            if (userId) {
                const myReg = registrations.find(r => r.user_id === userId);
                raw.isRegistered = !!myReg;
                raw.isSubmitted = myReg ? myReg.is_submitted : false;
            } else {
                raw.isRegistered = false;
                raw.isSubmitted = false;
            }

            // Get problems
            const problems = await ContestProblem.findAll({ where: { contest_id: c.id }, order: [['display_order', 'ASC']] });
            raw.problemIds = problems.map(p => p.problem_id);

            // Fetch problem details for student status (AC/WA) within this contest
            if (userId && raw.problemIds.length > 0) {
                const userSubmissions = await CodingSubmission.findAll({
                    where: {
                        user_id: userId,
                        contest_id: c.id,
                        problem_id: raw.problemIds
                    }
                });

                // Attach simplified status per problem for this user
                raw.userProblemStatus = {};
                userSubmissions.forEach(sub => {
                    // If already AC, keep it
                    if (raw.userProblemStatus[sub.problem_id] === 'AC') return;
                    raw.userProblemStatus[sub.problem_id] = sub.status;
                });
            }

            // Get results if any (for stats)
            const results = await ContestResult.findAll({ where: { contest_id: c.id } });
            raw.results = results.map(r => ({
                userId: r.user_id,
                rank: r.rank,
                score: r.score,
                awardName: r.award_name,
                certificateCode: r.certificate_code,
                isPublished: r.is_published
            }));

            // Get project submissions for stats/count
            const projectSubs = await ProjectSubmission.findAll({ where: { contest_id: c.id } });
            raw.projectSubmissions = projectSubs.map(s => ({
                userId: s.user_id,
                score: s.score,
                feedback: s.feedback,
                submittedAt: s.submitted_at,
                // Make sure file URLs are present in list retrieval to avoid frontend 'unknown file' rendering
                codeUrl: s.code_url,
                docUrl: s.doc_url,
                videoUrl: s.video_url
            }));

            return raw;
        }));

        res.json(enrichedContests);
    } catch (error) {
        console.error("Fetch contests error:", error);
        res.status(500).json({ message: 'Error fetching contests' });
    }
};

export const getContestById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const contest = await Contest.findByPk(id);
        if (!contest) return res.status(404).json({ message: 'Contest not found' });

        // Fetch problems if authorized or contest started
        // For now, simple return
        res.json(transformContest(contest));
    } catch (error) {
        res.status(500).json({ message: 'Error fetching contest' });
    }
};

export const createContest = async (req: Request, res: Response) => {
    try {
        const { id, title, startTime, endTime, type, description, problemIds } = req.body;
        // In real ID generated by UUID or passed in
        const contestId = id || uuidv4();

        const contest = await Contest.create({
            id: contestId,
            title,
            start_time: startTime,
            end_time: endTime,
            type: type || 'CODING',
            description
        });

        if (problemIds && Array.isArray(problemIds)) {
            const problems = problemIds.map((pid: string, index: number) => ({
                contest_id: contestId,
                problem_id: pid,
                score_weight: 100, // Default score
                display_order: index
            }));
            await ContestProblem.bulkCreate(problems);
        }

        res.status(201).json(transformContest(contest));
    } catch (error) {
        console.error("Create contest error:", error);
        res.status(500).json({ message: 'Error creating contest' });
    }
};

export const updateContest = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title, startTime, endTime, type, description, problemIds, results } = req.body;

        const contest = await Contest.findByPk(id);
        if (!contest) return res.status(404).json({ message: 'Contest not found' });

        await contest.update({
            title,
            start_time: startTime,
            end_time: endTime,
            type,
            description,
            is_leaderboard_open: req.body.isLeaderboardOpen,
            certificate_config: req.body.certificateConfig
        });

        // Update problems if provided
        if (problemIds && Array.isArray(problemIds)) {
            // Transactional update would be better
            await ContestProblem.destroy({ where: { contest_id: id } });
            const problems = problemIds.map((pid: string, index: number) => ({
                contest_id: id,
                problem_id: pid,
                score_weight: 100,
                display_order: index
            }));
            await ContestProblem.bulkCreate(problems);
        }

        // Update results (Awards) if provided
        if (results && Array.isArray(results)) {
            // Get existing results for preserving codes if needed
            const existingResults = await ContestResult.findAll({ where: { contest_id: id } });
            const existingMap = new Map(existingResults.map(r => [r.user_id, r]));

            const resultsToSave = results.map((r: any) => {
                const existing = existingMap.get(r.userId);
                let code = existing?.certificate_code || r.certificateCode;

                // Generate code if award exists but code doesn't
                if (!code && r.awardName) {
                    code = uuidv4().substring(0, 8).toUpperCase();
                }
                // Clear code if award removed
                if (!r.awardName) code = null;

                return {
                    contest_id: id,
                    user_id: r.userId,
                    rank: r.rank || 0,
                    score: r.score || 0,
                    award_name: r.awardName,
                    certificate_code: code,
                    is_published: true // Saving awards implies publishing
                };
            });

            // Using bulkCreate with updateOnDuplicate to upsert
            await ContestResult.bulkCreate(resultsToSave, {
                updateOnDuplicate: ['rank', 'score', 'award_name', 'certificate_code', 'is_published']
            });
        }

        res.json(transformContest(contest));
    } catch (error) {
        console.error("Update contest error:", error);
        res.status(500).json({ message: 'Error updating contest' });
    }
};

export const deleteContest = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const contest = await Contest.findByPk(id);
        if (!contest) return res.status(404).json({ message: 'Contest not found' });

        await contest.destroy();
        // Cleanup associated records
        await ContestProblem.destroy({ where: { contest_id: id } });
        await ContestRegistration.destroy({ where: { contest_id: id } });
        await ContestResult.destroy({ where: { contest_id: id } });

        res.json({ message: 'Contest deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting contest' });
    }
};

export const getProjectSubmissions = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // contest_id
        const submissions = await ProjectSubmission.findAll({ where: { contest_id: id } });

        // Fetch user names for the submissions
        const enriched = await Promise.all(submissions.map(async (s) => {
            const user = await User.findByPk(s.user_id);
            const raw = s.toJSON() as any;
            raw.userName = user?.name || '未知用户';
            raw.userId = raw.user_id;
            raw.className = user?.class_name || '';
            raw.college = user?.college || '';
            raw.major = user?.major || '';

            // Map keys for frontend
            raw.codeUrl = raw.code_url;
            raw.docUrl = raw.doc_url;
            raw.videoUrl = raw.video_url;
            raw.submittedAt = raw.submitted_at;

            return raw;
        }));

        res.json(enriched);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching project submissions' });
    }
};

export const gradeProjectSubmission = async (req: Request, res: Response) => {
    try {
        const { id, userId } = req.params; // contest_id, user_id
        const { score, feedback } = req.body;

        console.log('[DEBUG] gradeProjectSubmission called');
        console.log('[DEBUG] id:', id, 'userId:', userId);
        console.log('[DEBUG] score:', score, 'feedback:', feedback);

        const submission = await ProjectSubmission.findOne({ where: { contest_id: id, user_id: userId } });
        if (!submission) return res.status(404).json({ message: 'Submission not found' });

        await submission.update({ score, feedback });

        // Return mapped object
        const raw = submission.toJSON() as any;
        raw.codeUrl = raw.code_url;
        raw.docUrl = raw.doc_url;
        raw.videoUrl = raw.video_url;
        raw.submittedAt = raw.submitted_at;

        res.json(raw);
    } catch (error) {
        res.status(500).json({ message: 'Error grading submission' });
    }
};

export const submitProject = async (req: Request | any, res: Response) => {
    try {
        const { id } = req.params; // contest_id
        const user_id = req.user.id;
        const { videoUrl } = req.body;

        console.log('[DEBUG] submitProject called');
        console.log('[DEBUG] contestId:', id, 'userId:', user_id);
        console.log('[DEBUG] req.files keys:', req.files ? Object.keys(req.files) : 'null');
        console.log('[DEBUG] req.body:', req.body);

        // Handle Files
        const files = req.files as any;
        const codeFile = files?.['code']?.[0];
        const docFile = files?.['doc']?.[0];

        // Construct server URLs
        // We assume static serve is set up for /uploads, or we need to add it.
        // Let's assume endpoint usage: http://host:port/uploads/submissions/filename
        const baseUrl = process.env.API_URL || 'http://localhost:3001';
        // Need to ensure app exposes uploads folder.

        const codeUrl = codeFile ? `${baseUrl}/uploads/submissions/${codeFile.filename}` : undefined;
        const docUrl = docFile ? `${baseUrl}/uploads/submissions/${docFile.filename}` : undefined;

        const contest = await Contest.findByPk(id);
        if (!contest) return res.status(404).json({ message: 'Contest not found' });

        // Check if registration exists
        const registration = await ContestRegistration.findOne({ where: { contest_id: id, user_id } });
        if (!registration) return res.status(403).json({ message: 'Not registered for this contest' });

        // Create or update submission
        const [submission, created] = await ProjectSubmission.findOrCreate({
            where: { contest_id: id, user_id },
            defaults: {
                contest_id: id,
                user_id,
                code_url: codeUrl || '',
                doc_url: docUrl || '',
                video_url: videoUrl,
                submitted_at: new Date()
            }
        });

        if (!created) {
            // Only update fields that are provided (allow partial re-upload if logic supported, but usually re-upload ignores old files)
            // But here we want to replace if new file exists, keep old if not? 
            // Usually re-submission requires full set or we keep old.
            // Let's assume if file uploaded, replace. If not, keep old (if undefined). 
            // But if user didn't select file, it might be undefined.

            const updateData: any = {
                video_url: videoUrl,
                submitted_at: new Date(),
                score: undefined // Reset score
            };
            if (codeUrl) updateData.code_url = codeUrl;
            if (docUrl) updateData.doc_url = docUrl;

            await submission.update(updateData);
        }

        const rawSubmission = submission.toJSON() as any;
        rawSubmission.codeUrl = rawSubmission.code_url;
        rawSubmission.docUrl = rawSubmission.doc_url;
        rawSubmission.videoUrl = rawSubmission.video_url;
        rawSubmission.submittedAt = rawSubmission.submitted_at;
        // userId and contestId are also needed by frontend (match existing types)
        rawSubmission.userId = rawSubmission.user_id;

        res.json(rawSubmission);
    } catch (error) {
        console.error("Project submission error:", error);
        res.status(500).json({ message: 'Error submitting project' });
    }
};

export const registerContest = async (req: Request | any, res: Response) => {
    try {
        const { id } = req.params; // contest_id
        const user_id = req.user.id;

        const contest = await Contest.findByPk(id);
        if (!contest) return res.status(404).json({ message: 'Contest not found' });

        // Prevent registration if contest ended
        if (new Date() > new Date(contest.end_time)) {
            return res.status(400).json({ message: '此比赛已结束，无法报名' });
        }

        await ContestRegistration.create({
            contest_id: id,
            user_id: user_id,
            is_submitted: false
        });

        res.json({ message: 'Registered successfully' });
    } catch (error: any) {
        console.error("Register contest error:", error);
        // Better error message if it's a unique constraint error
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: '您已报名参加此比赛' });
        }
        res.status(500).json({ message: '报名失败，请稍后重试' });
    }
};

export const submitContestExam = async (req: Request | any, res: Response) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;

        const registration = await ContestRegistration.findOne({
            where: { contest_id: id, user_id: user_id }
        });

        if (!registration) {
            return res.status(404).json({ message: '未找到报名记录' });
        }

        if (registration.is_submitted) {
            return res.status(400).json({ message: '您已交卷，不可重复提交' });
        }

        await registration.update({
            is_submitted: true,
            submitted_at: new Date()
        });

        res.json({ message: '交卷成功' });
    } catch (error) {
        console.error("Submit exam error:", error);
        res.status(500).json({ message: '交卷失败' });
    }
};

export const unregisterStudent = async (req: Request, res: Response) => {
    try {
        const { id, userId } = req.params; // contest_id, student_user_id

        const registration = await ContestRegistration.findOne({ where: { contest_id: id, user_id: userId } });
        if (!registration) return res.status(404).json({ message: 'Registration not found' });

        await registration.destroy();
        res.json({ message: 'Student unregistered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error unregistering student' });
    }
};

export const addProblemToContest = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // contest_id
        const { problem_id, score_weight, display_order } = req.body;

        await ContestProblem.create({
            contest_id: id,
            problem_id,
            score_weight,
            display_order
        });

        res.json({ message: 'Problem added to contest' });
    } catch (error) {
        res.status(500).json({ message: 'Error adding problem to contest' });
    }
};

// --- Settlement & Results ---

export const settleContest = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // contest_id
        const contest = await Contest.findByPk(id);
        if (!contest) return res.status(404).json({ message: 'Contest not found' });

        if (contest.type === 'CODING') {
            const participants = await ContestRegistration.findAll({ where: { contest_id: id } });
            const userIds = participants.map(p => p.user_id);

            const submissions = await CodingSubmission.findAll({
                where: {
                    contest_id: id,
                    user_id: { [Op.in]: userIds },
                    status: 'AC'
                }
            });

            const userStats: Record<string, { solved: Set<string>, time: number }> = {};
            userIds.forEach(uid => { userStats[uid] = { solved: new Set(), time: 0 }; });

            submissions.forEach(sub => {
                if (userStats[sub.user_id]) {
                    userStats[sub.user_id].solved.add(sub.problem_id);
                }
            });

            const sortedUsers = userIds.map(uid => ({
                userId: uid,
                score: userStats[uid].solved.size
            })).sort((a, b) => b.score - a.score);

            await ContestResult.destroy({ where: { contest_id: id } });

            const resultsToCreate = sortedUsers.map((u, index) => {
                let award = null;
                const rank = index + 1;
                if (rank === 1) award = "冠军 (Champion)";
                else if (rank === 2) award = "亚军 (Runner-up)";
                else if (rank === 3) award = "季军 (Third Place)";
                else if (rank <= 10) award = "优胜奖 (Excellence Award)";

                return {
                    contest_id: id,
                    user_id: u.userId,
                    rank: rank,
                    score: u.score,
                    award_name: award,
                    certificate_code: award ? uuidv4().substring(0, 8).toUpperCase() : null,
                    is_published: false
                };
            });

            await ContestResult.bulkCreate(resultsToCreate);
            res.json({ message: `Contest settled. ${resultsToCreate.length} results generated.` });

        } else {
            res.status(501).json({ message: 'Project contest settlement not implemented automatically yet.' });
        }
    } catch (error) {
        console.error("Settlement error:", error);
        res.status(500).json({ message: 'Error settling contest' });
    }
};

export const publishResults = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await ContestResult.update({ is_published: true }, { where: { contest_id: id } });
        res.json({ message: 'Results published' });
    } catch (error) {
        res.status(500).json({ message: 'Error publishing results' });
    }
};

export const getMyContestResult = async (req: Request | any, res: Response) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;

        const result = await ContestResult.findOne({
            where: { contest_id: id, user_id, is_published: true }
        });

        if (!result) return res.status(404).json({ message: 'No published result found' });
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching result' });
    }
};
export const getContestLeaderboard = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const contest = await Contest.findByPk(id);
        if (!contest) return res.status(404).json({ message: 'Contest not found' });

        // Get all registrants
        const participants = await ContestRegistration.findAll({ where: { contest_id: id } });
        const userIds = participants.map(p => p.user_id);

        // Get all problem IDs for this contest
        const contestProblems = await ContestProblem.findAll({ where: { contest_id: id } });
        const problemIds = contestProblems.map(p => p.problem_id);

        // Fetch all submissions for these users in this contest
        const submissions = await CodingSubmission.findAll({
            where: {
                contest_id: id,
                user_id: { [Op.in]: userIds }
            },
            order: [['submitted_at', 'ASC']]
        });

        // ACM Ranking Logic: Solved Count desc, Penalty asc
        // Penalty = sum(time to AC) + 20 minutes * number of failures before AC
        const userStats: Record<string, { solved: Set<string>, failures: Record<string, number>, time: number, name: string }> = {};

        // Initialize with user names
        const users = await User.findAll({ where: { id: { [Op.in]: userIds } } });
        users.forEach(u => {
            userStats[u.id] = { solved: new Set(), failures: {}, time: 0, name: u.name };
        });

        const startTime = new Date(contest.start_time).getTime();

        submissions.forEach(sub => {
            const stats = userStats[sub.user_id];
            if (!stats) return;

            // If already solved, ignore further submissions
            if (stats.solved.has(sub.problem_id)) return;

            if (sub.status === 'AC') {
                stats.solved.add(sub.problem_id);
                // Time in minutes from start
                const solvedTime = Math.floor((new Date(sub.submitted_at || new Date()).getTime() - startTime) / (1000 * 60));
                const failPenalty = (stats.failures[sub.problem_id] || 0) * 20;
                stats.time += solvedTime + failPenalty;
            } else if (sub.status !== 'PENDING' && sub.status !== 'CE') {
                // Wrong answer/Runtime error etc count as penalty
                stats.failures[sub.problem_id] = (stats.failures[sub.problem_id] || 0) + 1;
            }
        });

        const ranking = Object.keys(userStats).map(uid => ({
            userId: uid,
            name: userStats[uid].name,
            solved: userStats[uid].solved.size,
            time: userStats[uid].time,
            problems: problemIds.map(pid => {
                const solved = userStats[uid].solved.has(pid);
                const fails = userStats[uid].failures[pid] || 0;
                return { problemId: pid, solved, fails };
            })
        })).sort((a, b) => {
            if (b.solved !== a.solved) return b.solved - a.solved;
            return a.time - b.time;
        }).map((item, index) => ({ ...item, rank: index + 1 }));

        res.json(ranking);
    } catch (error) {
        console.error("Leaderboard error:", error);
        res.status(500).json({ message: 'Error fetching leaderboard' });
    }
};
