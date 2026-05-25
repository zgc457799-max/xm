import { Request, Response } from 'express';
import {
    analyzeProblemConcepts,
    getProblemHint,
    analyzeCodeError,
    generateLogicFlowchart,
    smartParseProblem,
    generateTestCases,
    generateCertificateBackground,
    generateSolutionCode,
    smartParseBatchProblems
} from '../services/aiService';
import { EdgeTTS } from 'edge-tts-universal';

// Teacher: Parse Batch Problems
export const parseBatchProblems = async (req: Request, res: Response) => {
    try {
        const { rawText, expectedCount } = req.body;
        const result = await smartParseBatchProblems(rawText, expectedCount);
        res.json(result); // Array
    } catch (error) {
        res.status(500).json({ message: 'AI Batch Parse Failed' });
    }
};

// Teacher: Generate Reference Code
export const genReferenceCode = async (req: Request, res: Response) => {
    try {
        const { problemDescription, language } = req.body;
        const result = await generateSolutionCode(problemDescription, language || 'c');
        res.json({ code: result });
    } catch (error) {
        res.status(500).json({ message: 'AI Code Gen Failed' });
    }
};

// Student: Analyze Concept
export const analyzeProblem = async (req: Request, res: Response) => {
    try {
        const { problemDescription, language } = req.body;
        if (!problemDescription) return res.status(400).json({ message: 'Missing problemDescription' });

        const result = await analyzeProblemConcepts(problemDescription, language || 'any');
        res.json({ content: result });
    } catch (error) {
        console.error('AI Analysis Error:', error);
        res.status(500).json({ message: 'AI Analysis Failed' });
    }
};

// Student: Get Hint
export const getHint = async (req: Request, res: Response) => {
    try {
        const { problemDescription, currentCode, language } = req.body;
        const result = await getProblemHint(problemDescription, currentCode || "", language || 'any');
        res.json({ content: result });
    } catch (error) {
        console.error('AI Hint Error:', error);
        res.status(500).json({ message: 'AI Hint Failed' });
    }
};

// Student: Analyze Error
export const analyzeError = async (req: Request, res: Response) => {
    try {
        const { problemDescription, currentCode, errorMsg } = req.body;
        const result = await analyzeCodeError(problemDescription, currentCode || "", errorMsg || "");
        res.json({ content: result });
    } catch (error) {
        res.status(500).json({ message: 'AI Debug Failed' });
    }
};

// Student: Flowchart
export const getFlowchart = async (req: Request, res: Response) => {
    try {
        const { problemDescription, language, context } = req.body;
        const result = await generateLogicFlowchart(problemDescription, language || 'any', context || "");
        res.json({ content: result });
    } catch (error) {
        res.status(500).json({ message: 'AI Flowchart Failed' });
    }
};

// Teacher: Smart Parse
export const parseProblem = async (req: Request, res: Response) => {
    try {
        const { rawText } = req.body;
        const result = await smartParseProblem(rawText);
        res.json(result); // JSON object
    } catch (error) {
        res.status(500).json({ message: 'AI Parse Failed' });
    }
};

// Teacher: Generate Test Cases
export const genTestCases = async (req: Request, res: Response) => {
    try {
        const { problemDescription, count, referenceCode } = req.body;
        const result = await generateTestCases(problemDescription, count || 5, referenceCode);
        res.json(result); // Array
    } catch (error) {
        res.status(500).json({ message: 'AI Test Case Gen Failed' });
    }
};

// Teacher: Generate Certificate
export const genCertificateBg = async (req: Request, res: Response) => {
    try {
        const { title } = req.body;
        const result = await generateCertificateBackground(title);
        res.json({ image: result }); // Base64 or URL
    } catch (error) {
        res.status(500).json({ message: 'AI Image Gen Failed' });
    }
};

// Student: TTS using Free Edge TTS (Microsoft - High Quality!)
export const getTtsAudio = async (req: Request, res: Response) => {
    try {
        const { text, voiceType } = req.body;
        if (!text) return res.status(400).json({ message: 'Missing text' });

        // 选择合适的语音和参数
        let voice = 'zh-CN-XiaoxiaoNeural';
        let rate = '+0%';
        let pitch = '+0Hz';

        if (voiceType === 'spongebob') {
            // 海绵宝宝：活泼可爱的女声，语速快，音调高
            voice = 'zh-CN-XiaoyiNeural'; // 晓艺 - 活泼开朗
            rate = '+35%';
            pitch = '+20Hz';
        } else if (voiceType === 'patrick') {
            // 派大星：憨厚稳重的男声，语速慢，音调低
            voice = 'zh-CN-YunyangNeural'; // 云扬 - 稳重专业
            rate = '-20%';
            pitch = '-15Hz';
        }

        console.log(`[AI TTS] Generating Edge TTS for: "${text.substring(0, 30)}..."`);
        console.log(`[AI TTS] Voice: ${voice}, Rate: ${rate}, Pitch: ${pitch}`);

        // 使用 Edge TTS 生成语音
        const tts = new EdgeTTS(text, voice, {
            rate: rate,
            pitch: pitch
        });
        const result = await tts.synthesize();
        
        // 获取音频 buffer
        const audioBuffer = Buffer.from(await result.audio.arrayBuffer());

        res.set('Content-Type', 'audio/mpeg');
        res.send(audioBuffer);
    } catch (error: any) {
        console.error('[AI TTS] Error during Edge TTS generation:', error);
        res.status(500).json({ 
            message: '语音合成失败，请检查网络连接', 
            error: error.message 
        });
    }
};
