import { Request, Response } from 'express';
import CodingSubmission from '../models/CodingSubmission';
import ProjectSubmission from '../models/ProjectSubmission';
import { judgeSubmission } from '../services/judgeService';

// Submit Code
export const submitCode = async (req: Request | any, res: Response) => {
    try {
        const user_id = req.user.id; // From Auth Middleware
        const { problem_id, contest_id, language, code_content } = req.body;

        // 1. Create Submission Record
        const submission = await CodingSubmission.create({
            user_id,
            problem_id,
            contest_id,
            language,
            code_content
        });

        // 2. Trigger Async Judge
        console.log(`Created submission ${submission.id} for user ${user_id}`);
        judgeSubmission(submission.id);

        res.status(201).json({
            message: 'Submitted successfully',
            submission_id: submission.id
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error submitting code' });
    }
};

// Get Submission Status/Result
export const getSubmission = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const submission = await CodingSubmission.findByPk(id);

        if (!submission) {
            console.log(`Submission not found for ID: ${id} (Type: ${typeof id})`);
            // Debug: Print what IS in the database
            const allSubmissions = await CodingSubmission.findAll({ attributes: ['id', 'user_id', 'status'], limit: 5 });
            console.log('Recent submissions in DB:', JSON.stringify(allSubmissions, null, 2));
            return res.status(404).json({ message: 'Submission not found' });
        }
        // console.log(`Retrieved submission ${id}:`, submission.status);
        res.json(submission);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching submission' });
    }
};

// Get User Submissions (History)
export const getUserSubmissions = async (req: Request | any, res: Response) => {
    try {
        const user_id = req.user.id;
        const submissions = await CodingSubmission.findAll({
            where: { user_id },
            order: [['submitted_at', 'DESC']],
            limit: 50
        });
        res.json(submissions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching history' });
    }
}

// Project Submission (Submit Works)
export const submitProject = async (req: Request | any, res: Response) => {
    try {
        const user_id = req.user.id;
        const { contest_id, code_url, doc_url, video_url } = req.body;

        // Check if already submitted? Upsert logic?
        // simple create for now
        const submission = await ProjectSubmission.create({
            contest_id,
            user_id,
            code_url,
            doc_url,
            video_url
        });

        res.status(201).json(submission);
    } catch (error) {
        res.status(500).json({ message: 'Error submitting project' });
    }
};
