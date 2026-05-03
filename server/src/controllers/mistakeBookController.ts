import { Request, Response } from 'express';
import MistakeBook from '../models/MistakeBook';
import Problem from '../models/Problem';

export const addToMistakeBook = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.id;
        const { problemId } = req.body;

        if (!problemId) {
            return res.status(400).json({ message: 'Problem ID is required' });
        }

        const [entry, created] = await MistakeBook.findOrCreate({
            where: { user_id: userId, problem_id: problemId }
        });

        if (created) {
            res.status(201).json({ message: 'Added to mistake book', entry });
        } else {
            res.status(200).json({ message: 'Already in mistake book', entry });
        }
    } catch (error) {
        console.error('Add to mistake book error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const removeFromMistakeBook = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.id;
        const { problemId } = req.params;

        const deleted = await MistakeBook.destroy({
            where: { user_id: userId, problem_id: problemId }
        });

        if (deleted) {
            res.json({ message: 'Removed from mistake book' });
        } else {
            res.status(404).json({ message: 'Entry not found' });
        }
    } catch (error) {
        console.error('Remove from mistake book error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getMistakeBook = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.id;

        const mistakes = await MistakeBook.findAll({
            where: { user_id: userId },
            order: [['added_at', 'DESC']]
        });

        // Optionally, we could fetch full problem details here or let client fetch them by ID
        // For efficiency, let's fetch basic problem info
        const problemIds = mistakes.map(m => m.problem_id);
        const problems = await Problem.findAll({
            where: { id: problemIds },
            attributes: ['id', 'title', 'difficulty', 'tags', 'pass_rate']
        });

        res.json({ mistakes, problems });
    } catch (error) {
        console.error('Get mistake book error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
