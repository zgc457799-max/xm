import { Request, Response } from 'express';
import Problem from '../models/Problem';
import ProblemBank from '../models/ProblemBank';
import TestCase from '../models/TestCase';

// Get all banks
export const getBanks = async (req: Request, res: Response) => {
    try {
        const banks = await ProblemBank.findAll();
        res.json(banks);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching banks' });
    }
};

export const createBank = async (req: Request, res: Response) => {
    try {
        const bank = await ProblemBank.create({
            ...req.body,
            id: req.body.id || `b${Date.now()}` // fallback ID generation if needed, though DB usually handles it or UUID
        });
        res.status(201).json(bank);
    } catch (error) {
        console.error("Create bank error:", error);
        res.status(500).json({ message: 'Error creating bank' });
    }
};

export const updateBank = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const bank = await ProblemBank.findByPk(id);
        if (!bank) return res.status(404).json({ message: 'Bank not found' });
        await bank.update(req.body);
        res.json(bank);
    } catch (error) {
        res.status(500).json({ message: 'Error updating bank' });
    }
};

export const deleteBank = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const bank = await ProblemBank.findByPk(id);
        if (!bank) return res.status(404).json({ message: 'Bank not found' });

        // Remove bankId from associated problems
        await Problem.update({ bank_id: null as any }, { where: { bank_id: id } });

        await bank.destroy();
        res.json({ message: 'Bank deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting bank' });
    }
};

// Get problems (with filters and solved status)
export const getProblems = async (req: Request, res: Response) => {
    try {
        const { bank_id, difficulty, search } = req.query;
        // @ts-ignore - req.user is added by authenticateToken middleware
        const userId = req.user?.id;

        const { Op } = require('sequelize');
        const whereClause: any = {};

        if (bank_id) whereClause.bank_id = bank_id;
        if (difficulty && difficulty !== '全部') {
            const difficultyMap: any = {
                '简单': 'Easy',
                '中等': 'Medium',
                '困难': 'Hard'
            };
            whereClause.difficulty = difficultyMap[difficulty as string] || difficulty;
        }
        if (search) {
            whereClause[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } }
            ];
        }

        const problems = await Problem.findAll({
            where: whereClause,
            include: [{ model: TestCase, as: 'testCases', attributes: ['id'] }],
            order: [['created_at', 'DESC']]
        });

        // If userId is present, find which problems this user has solved (AC status)
        let solvedProblemIds: Set<string> = new Set();
        if (userId) {
            const CodingSubmission = require('../models/CodingSubmission').default;
            const solvedSubmissions = await CodingSubmission.findAll({
                where: {
                    user_id: userId,
                    status: 'AC'
                },
                attributes: ['problem_id'],
                group: ['problem_id']
            });
            solvedProblemIds = new Set(solvedSubmissions.map((s: any) => s.problem_id));
        }

        // Map snake_case to camelCase and include status
        const mappedProblems = problems.map(p => {
            const raw = p.toJSON() as any;
            raw.bankId = raw.bank_id;
            raw.inputExample = raw.input_example;
            raw.outputExample = raw.output_example;
            raw.passRate = raw.pass_rate;
            raw.isSolved = solvedProblemIds.has(p.id);
            return raw;
        });

        res.json(mappedProblems);
    } catch (error) {
        console.error("Fetch problems error:", error);
        res.status(500).json({ message: 'Error fetching problems' });
    }
};

// Get single problem details
export const getProblemById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const problem = await Problem.findByPk(id, {
            include: [{ model: TestCase, as: 'testCases' }] // Use Alias
        });
        if (!problem) return res.status(404).json({ message: 'Problem not found' });

        // Transform test cases for frontend (input_data -> input)
        const raw = problem.toJSON() as any;

        // Map db snake_case to frontend camelCase
        raw.bankId = raw.bank_id;
        raw.inputExample = raw.input_example;
        raw.outputExample = raw.output_example;
        raw.passRate = raw.pass_rate;

        // "testCases" usually comes from the association alias now
        if (raw.testCases) {
            raw.testCases = raw.testCases.map((tc: any) => ({
                input: tc.input_data,
                output: tc.output_data
            }));
            // No need to delete raw.TestCases as alias is now testCases
        }

        res.json(raw);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching problem' });
    }
};

// Create Problem (Teacher)
export const createProblem = async (req: Request, res: Response) => {
    try {
        console.log("Create Problem Body:", JSON.stringify(req.body, null, 2));
        const { testCases, inputExample, outputExample, bankId, ...problemData } = req.body;

        // Map frontend camelCase to db snake_case
        const dbPayload = {
            ...problemData,
            id: problemData.id || `p${Date.now()}${Math.floor(Math.random() * 1000)}`, // Generate ID
            input_example: inputExample,
            output_example: outputExample,
            bank_id: problemData.bank_id || bankId // Support both snake_case and camelCase
        };

        const problem = await Problem.create(dbPayload);

        if (testCases && Array.isArray(testCases)) {
            // Only create test cases that have data
            const validCases = testCases
                .filter((tc: any) => tc.input !== undefined && tc.output !== undefined)
                .map((tc: any) => ({
                    problem_id: problem.id,
                    input_data: tc.input,
                    output_data: tc.output,
                    is_hidden: true
                }));

            if (validCases.length > 0) {
                await TestCase.bulkCreate(validCases);
            }
        }

        // Transform response to match camelCase expectations in frontend
        const result = problem.toJSON() as any;
        result.bankId = result.bank_id;
        result.inputExample = result.input_example;
        result.outputExample = result.output_example;
        result.passRate = result.pass_rate;

        res.status(201).json(result);
    } catch (error) {
        console.error("Create problem error:", error);
        res.status(500).json({ message: 'Error creating problem' });
    }
};

// Update Problem
export const updateProblem = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        console.log(`Update Problem ${id} Body:`, JSON.stringify(req.body, null, 2));
        const { testCases, inputExample, outputExample, bankId, ...problemData } = req.body;

        const problem = await Problem.findByPk(id);
        if (!problem) return res.status(404).json({ message: 'Problem not found' });

        // Map frontend camelCase to db snake_case
        const dbPayload = {
            ...problemData,
            input_example: inputExample,
            output_example: outputExample,
            bank_id: problemData.bank_id || bankId // Support both
        };

        await problem.update(dbPayload);

        // Update Test Cases: Only if they contain data (input/output). 
        // If testCases contains only IDs (shallow object), ignore it to prevent overwriting with nulls.
        // Update Test Cases:
        // If testCases is provided as an array (even empty), we assume it's the new source of truth.
        if (testCases && Array.isArray(testCases)) {
            console.log(`[UpdateProblem] Updating test cases. Count: ${testCases.length}`);

            // 1. Clear existing cases
            await TestCase.destroy({ where: { problem_id: id } });

            // 2. Insert new cases if any
            if (testCases.length > 0) {
                const cases = testCases.map((tc: any) => ({
                    problem_id: id,
                    input_data: tc.input || '',
                    output_data: tc.output || '',
                    is_hidden: true
                }));
                await TestCase.bulkCreate(cases);
            }
        }

        // Transform response to match camelCase expectations in frontend
        const result = problem.toJSON() as any;
        result.bankId = result.bank_id;
        result.inputExample = result.input_example;
        result.outputExample = result.output_example;
        result.passRate = result.pass_rate;

        res.json(result);
    } catch (error) {
        console.error("Update problem error:", error);
        res.status(500).json({ message: 'Error updating problem' });
    }
};

export const deleteProblem = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const problem = await Problem.findByPk(id);
        if (!problem) return res.status(404).json({ message: 'Problem not found' });

        await problem.destroy();
        res.json({ message: 'Problem deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting problem' });
    }
};
// Validate Problem (Teacher Tool - Runs code against cases without saving submission)
export const validateProblem = async (req: Request, res: Response) => {
    try {
        const { code, language, testCases } = req.body;

        // Basic Validation
        if (!code || !language || !testCases || !Array.isArray(testCases)) {
            return res.status(400).json({ message: 'Missing required validation fields' });
        }

        if (testCases.length === 0) {
            return res.json({ status: 'AC', score: 100, message: 'No test cases provided, implicitly passed.' });
        }

        // Call the judge
        const { executeCode } = require('../services/judgeService'); // Dynamic import to avoid circular dep issues if any, though import at top is better
        const result = await executeCode(code, language, testCases);

        res.json(result);

    } catch (error) {
        console.error("Validation Logic Error:", error);
        res.status(500).json({ message: 'Error during validation execution' });
    }
};

// Import Problem details from a URL (returns details for preview without saving to DB)
export const importProblemFromUrl = async (req: Request, res: Response) => {
    try {
        const { url, platform } = req.body;
        if (!url) {
            return res.status(400).json({ message: '网页链接不能为空' });
        }

        const { scrapeProblemFromUrl } = require('../services/urlScraperService');
        const parsedProblem = await scrapeProblemFromUrl(url, platform || 'auto');

        res.json(parsedProblem);
    } catch (error: any) {
        console.error("Import from URL Error:", error);
        res.status(500).json({ message: error.message || '获取或解析网页题目失败' });
    }
};

// Batch Import curated preset problem bank directly into database
export const importPresetBank = async (req: Request, res: Response) => {
    try {
        const { presetId, bankId } = req.body;
        if (!presetId) {
            return res.status(400).json({ message: '未指定预设题单ID' });
        }

        const { getPresetProblems } = require('../services/urlScraperService');
        const problemsToImport = getPresetProblems(presetId);

        if (!problemsToImport || problemsToImport.length === 0) {
            return res.status(404).json({ message: '未找到该预设题单或题单为空' });
        }

        console.log(`[Preset Import] Importing ${problemsToImport.length} problems for preset ${presetId} into bank ${bankId}`);

        const importedProblems = [];

        for (const p of problemsToImport) {
            const problemId = `p${Date.now()}${Math.floor(Math.random() * 1000)}`;

            // Create Problem
            const problem = await Problem.create({
                id: problemId,
                bank_id: bankId || null,
                title: p.title,
                difficulty: p.difficulty || 'Easy',
                description: p.description,
                input_example: p.inputExample,
                output_example: p.outputExample,
                tags: p.tags || [],
                pass_rate: 0
            });

            // Create Test Cases if any
            if (p.testCases && Array.isArray(p.testCases)) {
                const cases = p.testCases.map((tc: any) => ({
                    problem_id: problemId,
                    input_data: tc.input || '',
                    output_data: tc.output || '',
                    is_hidden: true
                }));
                await TestCase.bulkCreate(cases);
            }

            const result = problem.toJSON() as any;
            result.bankId = result.bank_id;
            result.inputExample = result.input_example;
            result.outputExample = result.output_example;
            result.testCases = p.testCases;

            importedProblems.push(result);
        }

        res.status(201).json({
            message: `成功批量导入 ${importedProblems.length} 道题目并自动配齐测试用例！`,
            problems: importedProblems
        });
    } catch (error: any) {
        console.error("Import Preset Bank Error:", error);
        res.status(500).json({ message: '批量导入预设题单失败' });
    }
};

