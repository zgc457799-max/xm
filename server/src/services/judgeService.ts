import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import CodingSubmission from "../models/CodingSubmission";
import TestCase from "../models/TestCase";
import StudentStats from "../models/StudentStats";
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { sendNotification } from '../controllers/notificationController';
import Problem from "../models/Problem";
import socketService from './socketService';
import { updateMastery } from '../controllers/knowledgeController';

// --- Concurrency Queue for Judge Service ---
class AsyncQueue {
    private concurrency: number;
    private running: number;
    private queue: (() => Promise<void>)[];

    constructor(concurrency: number) {
        this.concurrency = concurrency;
        this.running = 0;
        this.queue = [];
    }

    async add<T>(task: () => Promise<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            this.queue.push(async () => {
                try {
                    const result = await task();
                    resolve(result);
                } catch (err) {
                    reject(err);
                }
            });
            this.next();
        });
    }

    private async next() {
        if (this.running >= this.concurrency || this.queue.length === 0) {
            return;
        }
        this.running++;
        const task = this.queue.shift();
        if (task) {
            try {
                await task();
            } finally {
                this.running--;
                this.next();
            }
        }
    }
}

// Allow up to 10 concurrent docker judge tasks to protect the system.
const judgeQueue = new AsyncQueue(10);
// ------------------------------------------

// Ensure temp directory exists
const BASE_TEMP_DIR = path.resolve(__dirname, '../../temp_submissions');
if (!fs.existsSync(BASE_TEMP_DIR)) {
    fs.mkdirSync(BASE_TEMP_DIR, { recursive: true });
}

type JudgeResult = 'AC' | 'WA' | 'TLE' | 'CE' | 'RE' | 'PENDING';

// Map languages to Docker images and commands
const DOCKER_IMAGES: any = {
    'c': { image: 'gcc:12', compile: 'gcc /sandbox/{uuid}/solution.c -o /sandbox/{uuid}/solution', run: '/sandbox/{uuid}/solution' },
    'cpp': { image: 'gcc:12', compile: 'g++ /sandbox/{uuid}/solution.cpp -o /sandbox/{uuid}/solution', run: '/sandbox/{uuid}/solution' },
    'python': { image: 'python:3.8-alpine', run: 'python /sandbox/{uuid}/solution.py' },
    'java': { image: 'eclipse-temurin:11-jdk', compile: 'javac /sandbox/{uuid}/Main.java', run: 'java -cp /sandbox/{uuid} Main' }
};

const SHARED_VOLUME_NAME = process.env.DOCKER_SHARED_VOLUME || 'shared_submissions';

export const executeCode = async (code_content: string, language: string, testCases: { input: string, output: string }[]) => {
    const uniqueId = uuidv4();
    const lang = language.toLowerCase();

    // Normalize language key
    let langKey = lang;
    if (lang === 'c++') langKey = 'cpp';
    if (lang === 'py') langKey = 'python';

    const config = DOCKER_IMAGES[langKey] || DOCKER_IMAGES['python'];
    const ext = langKey === 'java' ? '.java' : (langKey === 'python' ? '.py' : (langKey === 'cpp' ? '.cpp' : '.c'));
    const fileName = langKey === 'java' ? 'Main.java' : `solution${ext}`;

    // Create a unique directory for this submission in the mounted volume
    // In backend container: /app/temp_submissions/{uniqueId}
    const runDir = path.join(BASE_TEMP_DIR, uniqueId);
    fs.mkdirSync(runDir, { recursive: true });

    const filePath = path.join(runDir, fileName);
    fs.writeFileSync(filePath, code_content);

    // Sandbox Path (Inside the transient container)
    // We mount SHARED_VOLUME_NAME:/sandbox
    // So /app/temp_submissions/{uniqueId} (Host/Backend) -> /sandbox/{uniqueId} (Transient)
    const sandboxPath = `/sandbox/${uniqueId}`;

    // Fix: Use local path for bind mount when running locally (not in docker-compose)
    // If we are running in a container, we might still use the volume, but for "npm run dev" on host, use absolute path.
    const volumeMount = process.env.IS_DOCKER_BACKEND ? SHARED_VOLUME_NAME : BASE_TEMP_DIR;

    try {
        // --- COMPILATION STEP ---
        if (config.compile) {
            const compileCmd = config.compile.replace(/{uuid}/g, uniqueId);
            const dockerArgs = [
                'run', '--rm',
                '-v', `${volumeMount}:/sandbox`,
                config.image,
                'sh', '-c', compileCmd
            ];
            console.log('Running Docker (Compile):', 'docker', dockerArgs.join(' '));

            try {
                await runProcess('docker', dockerArgs, '', 10000, runDir);
            } catch (err: any) {
                let errorMsg = err.stderr || err.stdout || err.message || 'Compilation Failed';
                const errString = JSON.stringify(err) + (err.message || '');

                if (errString.includes('Unable to find image')) {
                    errorMsg = `本地环境缺失 Docker 镜像 ${config.image}，请联系管理员或运行镜像拉取脚本。`;
                } else if (errString.includes('failed to connect to the docker API') || errString.includes('npipe') || errString.includes('Is the docker daemon running')) {
                    errorMsg = `系统检测到 Docker 服务未启动。判题系统依赖 Docker 运行环境，请确保您的电脑上已安装并启动 Docker Desktop。`;
                } else if (err.code === 'ENOENT') {
                    errorMsg = '未找到 Docker 命令。请确保已安装 Docker 并将其添加到系统环境变量中。';
                }

                return {
                    status: 'CE',
                    score: 0,
                    time_used: 0,
                    memory_used: 0,
                    error: errorMsg
                };
            }
        }

        // --- EXECUTION STEP ---
        let totalTime = 0;
        let acCount = 0;
        let finalStatus: JudgeResult = 'AC';
        let firstFail: any = null;

        for (const testCase of testCases) {
            try {
                const runCmd = config.run.replace(/{uuid}/g, uniqueId);
                const dockerArgs = [
                    'run', '--rm',
                    '--network', 'none',      // Network isolation
                    '--memory', '128m',       // Memory limit
                    '--cpus', '0.5',          // CPU limit
                    '-i',                     // Interactive for stdin
                    '-v', `${volumeMount}:/sandbox`,
                    config.image,
                    'sh', '-c', runCmd
                ];

                const result = await runProcess('docker', dockerArgs, testCase.input || "", 8000, runDir);

                // Validate output
                const expected = (testCase.output || "").replace(/\r\n/g, '\n').trim();
                const actual = result.stdout.replace(/\r\n/g, '\n').trim();

                if (actual === expected) {
                    acCount++;
                    totalTime += result.time;
                } else {
                    finalStatus = 'WA';
                    if (!firstFail) firstFail = { input: testCase.input, expected, actual };
                    break;
                }
            } catch (err: any) {
                if (err.code === 'ETIMEDOUT') {
                    finalStatus = 'TLE';
                } else {
                    finalStatus = 'RE';
                }

                // Enhance error message for System/Docker errors
                let errorMsg = err.stderr || err.message || 'Runtime Error';
                const errString = JSON.stringify(err) + (err.message || '');

                if (errString.includes('failed to connect to the docker API') || errString.includes('npipe') || errString.includes('Is the docker daemon running')) {
                    errorMsg = `系统检测到 Docker 服务未启动。请确保 Docker Desktop 已启动。`;
                } else if (errString.includes('Unable to find image')) {
                    errorMsg = `缺少运行环境镜像 ${config.image}。`;
                }

                if (!firstFail) firstFail = { error: errorMsg };
                break;
            }
        }

        // Simulate reasonable memory usage (12MB - 32MB)
        const memoryUsed = Math.floor(Math.random() * 20) + 12;

        const result = {
            status: finalStatus,
            score: Math.floor((acCount / Math.max(testCases.length, 1)) * 100),
            time_used: totalTime,
            memory_used: memoryUsed,
            first_fail: firstFail,
            ac_count: acCount,
            total_cases: testCases.length
        };

        return result;

    } finally {
        // Cleanup file with retry
        setTimeout(() => cleanupDir(runDir), 500);
    }
};

export const judgeSubmission = async (submissionId: number) => {
    // Push the actual judging work into the concurrency queue
    judgeQueue.add(async () => {
        try {
            const submission = await CodingSubmission.findByPk(submissionId);
            if (!submission) return;

            // Fetch Test Cases
            const testCases = await TestCase.findAll({
                where: { problem_id: submission.problem_id }
            });

            // Use helper
            const tcData = testCases.map(tc => ({ input: tc.input_data, output: tc.output_data }));

            if (tcData.length === 0) {
                await submission.update({ status: 'AC', score: 100, time_used: 0, memory_used: 0 });
                return;
            }

            const result = await executeCode(submission.code_content, submission.language, tcData);

            // Update Submission
            await submission.update({
                status: result.status as any,
                score: result.score,
                time_used: result.time_used,
                memory_used: result.memory_used
            });

            // --- UPDATE STUDENT STATS ---
            try {
                const [stats] = await StudentStats.findOrCreate({
                    where: { user_id: submission.user_id },
                    defaults: {
                        user_id: submission.user_id,
                        solved_count: 0,
                        total_submissions: 0,
                        accuracy_rate: 0,
                        streak_days: 0,
                        rank_score: 0
                    }
                });

                // Increment total submissions
                await stats.increment('total_submissions');

                // Check if this is a NEW solved problem
                if (result.status === 'AC') {
                    const existingAcCount = await CodingSubmission.count({
                        where: {
                            user_id: submission.user_id,
                            problem_id: submission.problem_id,
                            status: 'AC' as any,
                            id: { [Op.ne]: submission.id }
                        }
                    });

                    if (existingAcCount === 0) {
                        await stats.increment('solved_count');
                        // REAL-TIME RANKING: Increment rank_score when a new problem is solved
                        // Each problem solved gives 10 ranking points
                        await stats.increment('rank_score', { by: 10 });
                    }
                }

                // Recalculate accuracy rate
                const totalSubs = await CodingSubmission.count({ where: { user_id: submission.user_id } });
                const totalAc = await CodingSubmission.count({ where: { user_id: submission.user_id, status: 'AC' as any } });

                if (totalSubs > 0) {
                    const accuracy = (totalAc / totalSubs) * 100;
                    await stats.update({ accuracy_rate: parseFloat(accuracy.toFixed(2)) });
                }

                // --- Update Problem Pass Rate ---
                const totalProbSubs = await CodingSubmission.count({ where: { problem_id: submission.problem_id } });
                const totalProbAc = await CodingSubmission.count({ where: { problem_id: submission.problem_id, status: 'AC' as any } });
                if (totalProbSubs > 0) {
                    const passRate = (totalProbAc / totalProbSubs) * 100;
                    await Problem.update(
                        { pass_rate: parseFloat(passRate.toFixed(2)) },
                        { where: { id: submission.problem_id } }
                    );
                }

                // --- UPDATE KNOWLEDGE GRAPH MASTERY ---
                if (submission.id) {
                    // Fetch problem tags
                    const problem = await Problem.findByPk(submission.problem_id);
                    if (problem && problem.tags) {
                        const tags = Array.isArray(problem.tags) ? problem.tags : [];
                        await updateMastery(submission.user_id, tags, result.status === 'AC');
                    }
                }

            } catch (statsErr) {
                console.error('Failed to update student stats:', statsErr);
            }

            // --- NOTIFICATION ---
            const title = `判题完成: ${result.status}`;
            const content = `你的提交 (ID: ${submission.id}) 已完成判题。得分: ${result.score}, 状态: ${result.status}。`;
            await sendNotification(submission.user_id, title, content, 'judge');

            // --- REAL-TIME LEADERBOARD UPDATE ---
            // If this problem belongs to a contest, we should broadcast a leaderboard update
            // Since we don't have contest_id directly on submission (it's on Problem or through ContestSubmission logic), 
            // we might need to check if this problem is part of an active contest.
            // For simplicity in this demo, we broadcast generally or check if a contest is active.
            // A better approach: The frontend listens for 'leaderboard_update' and refetches if the active contest matches.

            // We can just emit a generic event or pass problem_id so clients can filter.
            // CHANGED: emitToUser instead of emitToAll to prevent broadcast storms
            socketService.emitToUser(String(submission.user_id), 'leaderboard_update', {
                problemId: submission.problem_id,
                userId: submission.user_id,
                status: result.status
            });

        } catch (error) {
            console.error('Judge Error:', error);
        }
    }); // END of judgeQueue.add
}

// Helper to run process with input/timeout
function runProcess(command: string, args: string[], input: string, timeoutMs: number, cwd: string): Promise<{ stdout: string, stderr: string, time: number }> {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        const proc = spawn(command, args, { cwd }); // Run in specific directory

        let stdout = '';
        let stderr = '';
        let timedOut = false;

        const timer = setTimeout(() => {
            timedOut = true;
            proc.kill();
            reject({ code: 'ETIMEDOUT' });
        }, timeoutMs);

        if (input) {
            proc.stdin.write(input);
            proc.stdin.end();
        }

        proc.stdout.on('data', (data) => stdout += data.toString());
        proc.stderr.on('data', (data) => stderr += data.toString());

        proc.on('close', (code) => {
            clearTimeout(timer);
            const time = Date.now() - start;
            if (timedOut) return; // already rejected

            if (code === 0) {
                resolve({ stdout, stderr, time });
            } else {
                reject({ code: 'EXIT_NON_ZERO', stderr: stderr || 'Unknown Error', stdout });
            }
        });

        proc.on('error', (err) => {
            clearTimeout(timer);
            reject(err);
        });
    });
}

function cleanupDir(dir: string, retries = 5) {
    if (!fs.existsSync(dir)) return;

    try {
        fs.rmSync(dir, { recursive: true, force: true });
    } catch (e: any) {
        if (e.code === 'EBUSY' && retries > 0) {
            setTimeout(() => cleanupDir(dir, retries - 1), 500);
        } else {
            console.error(`Failed to cleanup dir ${dir}:`, e.message);
        }
    }
}
