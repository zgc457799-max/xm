import { GoogleGenAI, Type } from "@google/genai";
import OpenAI from "openai";
import SystemSetting from "../models/SystemSetting";

// Default Models
const DEFAULT_TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-1.5-flash';
const DEFAULT_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-1.5-flash';

// Get Config from DB
const getAIConfig = async () => {
    try {
        const settings = await SystemSetting.findAll();
        const map: Record<string, string> = {};
        for (const s of settings) map[s.key] = s.value;

        return {
            provider: map['ai_provider'] || 'gemini',
            geminiKey: map['gemini_api_key'] || process.env.GEMINI_API_KEY || process.env.API_KEY || '',
            geminiModel: map['gemini_model'] || DEFAULT_TEXT_MODEL,
            siliconKey: map['siliconflow_api_key'] || '',
            siliconModel: map['siliconflow_model'] || 'Pro/deepseek-ai/DeepSeek-V3',
            aliyunKey: map['aliyun_api_key'] || '',
            aliyunModel: map['aliyun_model'] || 'qwen-turbo', // fallbacks
            disableReasoning: map['disable_reasoning'] === 'true',
        };
    } catch (e) {
        return {
            provider: 'gemini',
            geminiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || '',
            geminiModel: DEFAULT_TEXT_MODEL,
            siliconKey: '',
            siliconModel: '',
            aliyunKey: '',
            aliyunModel: '',
            disableReasoning: false,
        };
    }
};

// Generic Text Generation Wrapper
const generateText = async (prompt: string, systemInstruction?: string, jsonSchema?: any): Promise<string> => {
    const config = await getAIConfig();
    let finalSys = systemInstruction || "你是一个严谨的AI助手。";

    if (config.provider === 'siliconflow' && config.siliconKey) {
        const openai = new OpenAI({
            apiKey: config.siliconKey,
            baseURL: "https://api.siliconflow.cn/v1",
        });

        const messages: any[] = [];
        if (jsonSchema) {
            finalSys += `\n\n【极其重要】：你必须严格按照以下 JSON Schema 输出纯 JSON 格式数据。严禁输出任何解释性文字、严禁带有 markdown 标记（如 \`\`\`json ），只需且只能输出合法的 JSON 字符串：\n${JSON.stringify(jsonSchema)}`;
        }
        messages.push({ role: 'system', content: finalSys });
        messages.push({ role: 'user', content: prompt });

        // 业界跨模型关闭推理的“最佳实践”：通过预填 Assistant 结尾来诱骗带有思考链的模型跳过 <think> 阶段
        if (config.disableReasoning) {
            messages.push({ role: 'assistant', content: '<think>\n</think>\n' });
        }

        const response = await openai.chat.completions.create({
            model: config.siliconModel,
            messages: messages,
            stream: false
        });

        let content = response.choices[0]?.message?.content || "";
        // 清理因预填补而在极少数模型回显的空思考标记
        content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
        return content;
    } else if (config.provider === 'aliyun' && config.aliyunKey) {
        const openai = new OpenAI({
            apiKey: config.aliyunKey,
            baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
        });

        const messages: any[] = [];
        if (jsonSchema) {
            finalSys += `\n\n【极其重要】：你必须严格按照以下 JSON Schema 输出纯 JSON 格式数据。严禁输出任何解释性文字、严禁带有 markdown 标记（如 \`\`\`json ），只需且只能输出合法的 JSON 字符串（如果是数组则直接输出数组，如果是对象则输出对象）。\n\nJSON Schema:\n${JSON.stringify(jsonSchema)}`;
        }
        messages.push({ role: 'system', content: finalSys });
        messages.push({ role: 'user', content: prompt });

        if (config.disableReasoning) {
            messages.push({ role: 'assistant', content: '<think>\n</think>\n' });
        }

        const requestConfig: any = {
            model: config.aliyunModel,
            messages: messages,
            stream: false
        };

        // 阿里云特定关闭思考底层参数
        if (config.disableReasoning) {
            requestConfig.extra_body = { enable_thinking: false };
        }

        const response = await openai.chat.completions.create(requestConfig);

        let content = response.choices[0]?.message?.content || "";
        content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
        return content;
    } else {
        // Fallback or explicit Gemini
        const ai = new GoogleGenAI({ apiKey: config.geminiKey, baseURL: process.env.GEMINI_BASE_URL } as any);

        const genConfig: any = {};
        genConfig.systemInstruction = finalSys;
        if (jsonSchema) {
            genConfig.responseMimeType = "application/json";
            genConfig.responseSchema = jsonSchema;
        }

        const response = await ai.models.generateContent({
            model: config.geminiModel,
            contents: prompt,
            config: Object.keys(genConfig).length > 0 ? genConfig : undefined
        }).catch(err => {
            console.error("Gemini API Error details:", JSON.stringify(err, null, 2), err.message);
            throw err;
        });

        return response.text || "";
    }
};

// --- Helper: Clean JSON String ---
const cleanJsonString = (text: string): string => {
    if (!text) return "{}";

    let clean = text.trim();

    // 1. First try to extract from markdown code blocks with more flexible regex
    const jsonMatch = clean.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (jsonMatch && jsonMatch[1]) {
        const candidate = jsonMatch[1].trim();
        try {
            JSON.parse(candidate);
            return candidate;
        } catch (e) { }
    }

    // 2. Remove potential thinking tags first
    clean = clean.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    const tryParseBounds = (startChar: string, endChar: string): string | null => {
        let firstIdx = clean.indexOf(startChar);
        let lastIdx = clean.lastIndexOf(endChar);

        while (firstIdx !== -1 && lastIdx !== -1 && firstIdx < lastIdx) {
            const candidate = clean.substring(firstIdx, lastIdx + 1);
            try {
                const parsed = JSON.parse(candidate);
                // Validation: if we expect an array but get an empty object, keep searching
                if (startChar === '[' && !Array.isArray(parsed)) {
                    // try to find next [
                    firstIdx = clean.indexOf(startChar, firstIdx + 1);
                    continue;
                }
                return candidate;
            } catch (e) {
                // Try shrinking from the end too
                lastIdx = clean.lastIndexOf(endChar, lastIdx - 1);
            }
        }
        return null;
    };

    const arrResult = tryParseBounds('[', ']');
    if (arrResult) return arrResult;

    const objResult = tryParseBounds('{', '}');
    if (objResult) return objResult;

    // 3. Worst case fallback (might throw later but we try our best)
    return clean;
};

/**
 * Student: Analyze the coding problem to explain key concepts.
 */
export const analyzeProblemConcepts = async (problemDescription: string, language: string = 'any'): Promise<string> => {
    try {
        const prompt = `
      你是一位专业的计算机科学导师。当前编程语言环境为: ${language}。
      请分析以下编程题目的描述，并识别出解决该问题所需的关键算法、数据结构和核心概念。
      **要求**:
      1. 保持解释简洁、通俗易懂，适合初学者。
      2. 优先提供最简单、最直观的分析思路。
      3. **不要**直接提供完整的代码。
      4. 确保回答内容完整且逻辑闭合。
      
      题目: ${problemDescription}
    `;

        const responseText = await generateText(prompt, "你是一位帮助学生学习编程的耐心导师。");

        return responseText || "暂时无法分析该题目。";
    } catch (error) {
        console.error("AI Analysis Error:", error);
        return "AI 服务当前不可用，请检查您的网络或配置。";
    }
};

/**
 * Student: Provide a hint or pseudocode logic.
 */
export const getProblemHint = async (problemDescription: string, currentCode: string, language: string = 'any'): Promise<string> => {
    try {
        const prompt = `
      学生在解决这个问题时卡住了。请作为一位循循善诱的苏格拉底式导师，提供一个逻辑提示来帮助他们继续。
      当前语言环境: ${language}。
      
      **核心教学要求 (极其重要)**:
      1. **严禁直接提供正确的完整代码**。绝对不能让学生直接复制粘贴过关。
      2. **第一步**：使用启发式的提问引导（例如：“你注意到第5行的循环条件了吗？”或“如果输入是X，你的程序会输出什么？”）。
      3. **第二步**：提供高层次的解题思路或极少量的伪代码切入点，点到为止。
      4. **知识点约束**：请假设学生是初学者，仅使用最基础、对应当前关卡的语法（如 if-else, for循环），避免使用正则、Lambda表达式或高级内置函数等超纲内容。
      5. 请用生动、鼓励性的中文回答。

      题目: ${problemDescription}
      学生当前代码: ${currentCode}
    `;

        const responseText = await generateText(prompt);

        return responseText || "没有可用的提示。";
    } catch (error) {
        console.error("AI Hint Error:", error);
        return "AI 服务不可用。";
    }
};

/**
 * Student: Analyze code errors (compilation or runtime) and suggest fixes.
 */
export const analyzeCodeError = async (problemDescription: string, currentCode: string, errorMsg: string): Promise<string> => {
    try {
        const prompt = `
      学生在提交代码时遇到了错误（可能是语法错误、编译错误或逻辑结果错误）。请作为一位严谨但充满耐心的导师，分析提供的上下文。
      
      题目: ${problemDescription}
      
      报错信息或现象:
      ${errorMsg || "代码运行结果与预期不符（逻辑错误）。"}
      
      学生代码:
      ${currentCode}
      
      **核心教学要求 (极其重要)**:
      1. **绝对禁令**：禁止直接输出修改后的完整正确代码！
      2. **知识点约束**：假设学生是入门新手，解答和建议只能使用最基础的语法。遇到复杂问题时，请将其拆解为简单的基础步骤，禁止使用高级API一键解决。
      3. **如果报错提示了死循环（ERR_INFINITE_LOOP 或 Timeout）**：请以幽默易懂的方式向学生解释什么是死循环（比如变量没有正确递增、退出条件永远达不到），并精确指出哪里可能导致了死循环。
      4. 请用中文回答。必须严格按以下格式进行“三步引导法”输出：
      - **🧐 错误定位**: 指出具体是哪一行或哪一块逻辑出了问题。
      - **💡 错因分析**: 用通俗大白话解释为什么会错（比如“因为变量i一直没有增加，导致走不出大门”）。
      - **🛠️ 修复思路**: 给出修改建议或小段伪代码，用反问句启发学生自己动手（如“想想看，循环里的判断条件是不是写反了？”）。
    `;

        const responseText = await generateText(prompt);

        return responseText || "无法分析该错误。";
    } catch (error) {
        console.error("AI Debug Error:", error);
        return "AI 诊断服务当前不可用。";
    }
};

/**
 * Student: Generate Mermaid.js flowchart code for the logic.
 */
export const generateLogicFlowchart = async (problemDescription: string, language: string = 'any', context: string = ''): Promise<string> => {
    try {
        let promptText = "生成一个 Mermaid.js 流程图语法 (graph TD) 来表示解决此问题的逻辑。\n";
        promptText += "当前编程环境语言: " + language + "。\n";
        if (context) {
            promptText += "参考背景分析: " + context + "\n";
        }

        promptText += "\n***关键要求***:\n";
        promptText += "1. 只返回 mermaid 代码块。\n";
        promptText += "2. 节点标签请使用中文。\n";
        promptText += "3. **结合语言特性**: 如果当前是 C/C++，可以涉及指针或内存逻辑；如果是 Python，可以涉及列表推导式或核心库逻辑。\n";
        promptText += "4. 在处理节点中包含关键代码逻辑片段（如 \"if (x > 0)\"）。\n";
        promptText += "5. **极其重要**: 节点定义的标签如果包含任何特殊符号（特别是中括号、小括号、花括号、引号、大于/小于号、冒号），**必须**使用双引号包裹整个标签内容。\n";
        promptText += "   - **严禁**在双引号包裹的标签内部再次使用未经转义的双引号。如果需要引号，请使用单引号或中文引号。\n";
        promptText += "   - 正确示例: A[\"判断 nums[i] == target\"]\n";
        promptText += "   - 正确示例: B[\"输出内容: 'Hello World'\"]\n";
        promptText += "6. **布局优化 (核心)**: 为了防止文本溢出盒子，**必须**在任何长度超过 10 个中文字符或包含复杂表达式的标签中使用换行符 (在 Mermaid 内部标签中使用 HTML 的 br 标签) 进行手动换行。将单行文本拆分为多行，确保结果方块不致过宽。\n";
        promptText += "7. **逻辑严密性**: 必须确保流程是**闭合**的。所有分支（包括 if 的 else 分支或错误处理分支）最终都**必须**汇总汇聚到一个明确的“结束”节点，严禁逻辑中断或悬空。\n";
        promptText += "8. 不要使用 markdown 代码块标记 (无 ```)。\n\n";
        promptText += "题目: " + problemDescription + "\n";

        const responseText = await generateText(promptText);

        let text = responseText || "";
        // Cleanup simple markdown if present
        text = text.replace(/```mermaid/g, '').replace(/```/g, '').trim();
        return text;
    } catch (error) {
        console.error("AI Flowchart Error:", error);
        return "graph TD;\nA[\"生成流程图失败\"] --> B[\"请重试\"];";
    }
};

/**
 * Teacher: Parse raw text (from Word/PDF copy-paste) into structured Problem JSON.
 */
export const smartParseProblem = async (rawText: string): Promise<any> => {
    try {
        const prompt = `分析以下题目文本并提取为结构化的 JSON。
      
      **识别规则 (重要)**:
      1. **标签优先**: 如果发现“题目名称：”、“题目描述：”等标签，请精准提取其后内容。
      2. **语义兜底**: 若无上述标签，请依据语义解析：
         - [描述] 标题下的文本 -> description
         - [输入描述] 标题下的文本 -> description (拼接)
         - [示例] 中的代码块 -> inputExample / outputExample
         - 第一行非标题文字 -> title
      3. **严禁空白**: 必须根据全文推断出最合适的标题和描述，不允许返回空字符串。
      4. **Markdown 格式化 (极其重要)**: 
         - 请对 'description' 进行深度排版。使用 **加粗** 来标记题目中的关键变量（如 **n**, **a[i]**, **target**）。
         - 逻辑层级请使用 Markdown 的无序列表（-）或有序列表（1.）进行拆解。
         - 公式或复杂条件请使用行内代码反引号 (如 \`\\Check\`) 包裹。
         - 确保输出内容美观、结构清晰，适合在网页上直接渲染。
      5. 确保内容完整。

      文本内容:
      ${rawText}`;

        const schema = {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] },
                inputExample: { type: Type.STRING },
                outputExample: { type: Type.STRING },
                tags: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["title", "description", "difficulty"]
        };

        console.log("[AI Service] Starting Smart Parse for single problem...");
        const responseText = await generateText(
            prompt,
            "你是一个自动化数据录入助手。请必须严格按照提供的 JSON Schema 输出纯 JSON 数据，绝对不要包含任何其他说明文字或 Markdown 标记。",
            schema
        );

        const cleaned = cleanJsonString(responseText);
        return JSON.parse(cleaned);
    } catch (error) {
        console.error("AI Smart Parse Error:", error);
        throw new Error("解析题目失败");
    }
};

/**
 * Teacher: Generate multiple test cases (inputs/outputs) for a problem.
 */
export const generateTestCases = async (problemDescription: string, count: number = 8, referenceCode: string = ''): Promise<string> => {
    try {
        let promptText = `根据以下题目描述，生成 ${count} 组测试用例。
      
      **输出格式 (必须严格遵守)**:
      第1组：
      输入：
      {这里写输入数据}
      输出：
      {这里写输出数据}
      
      第2组：
      ...
      
      **要求**:
      1. **绝对禁令**: 严禁输出任何中文说明、描述文字、逻辑解释或提示性语句（如“第一行输入...”）。仅输出程序标准 IO 需要的**纯数据字符串**。
      2. **忽略描述文字**: 题目描述中包含的“输入描述”和“输出描述”文字段落仅供参考逻辑，**严禁**将其作为测试用例输出。
      3. 覆盖边界情况。
      4. 输入和输出必须是纯净的标准 IO 格式。

      题目描述: ${problemDescription}`;

        if (referenceCode && referenceCode.length > 50) {
            promptText += `\n\n可参考解答代码逻辑:\n${referenceCode}`;
        }

        const responseText = await generateText(promptText, "你是一个程序测评数据生成助手。直接输出符合格式的标签文本。");

        return responseText || "";
    } catch (error) {
        console.error("AI Test Case Gen Error:", error);
        return "";
    }
};

/**
 * Teacher: Generate a certificate background image based on contest context.
 */
export const generateCertificateBackground = async (contestTitle: string): Promise<string> => {
    try {
        const config = await getAIConfig();
        // Since SiliconFlow uses distinct image models like ObjectOriented (SD, Flux etc.) 
        // We might fallback to Gemini if imaging from Siliconflow isn't configured here properly, 
        // For now, let's keep using Gemini exclusively for Images just to be safe, or just use the OpenAI client if it supports images.
        // Actually, Siliconflow supports DALL-E wrapper but we need a different model.
        // Let's just use GoogleGenAI for images for backward compatibility unless we want to rewrite this.
        const ai = new GoogleGenAI({ apiKey: config.geminiKey, baseURL: process.env.GEMINI_BASE_URL } as any);

        const prompt = `Design a premium, professional certificate background for "${contestTitle}".
    Style: Academic, Prestigious, Gold and Cream/White theme.
    
    CRITICAL COMPOSITION RULES:
    1. Do NOT put a solid white box in the center. The center should be the same parchment/paper texture as the rest, just lighter brightness.
    2. Borders: Elegant, intricate geometric guilloche patterns on the edges ONLY.
    3. Center Area: Very subtle, high-brightness watermark pattern (almost white but with texture). Low contrast in the center to ensure text legibility.
    4. NO TEXT. The image must be purely graphical background.
    5. Aspect Ratio: Landscape 4:3.`;

        const response = await ai.models.generateContent({
            model: DEFAULT_IMAGE_MODEL,
            contents: prompt,
        });

        // Iterate through parts to find the image
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }

        return "";
    } catch (error) {
        console.error("Image Gen Error:", error);
        // Return empty or throw, controller will handle.
        return "";
    }
};

/**
 * Teacher: Generate reference solution code in a specific language.
 */
export const generateSolutionCode = async (problemDescription: string, language: string = 'c'): Promise<string> => {
    try {
        const prompt = `
      请根据以下题目描述，编写一份标准的 ${language} 参考解答代码。
      关键要求：
      1. 代码必须是完整的、可编译/运行的。
      2. 包含必要的头文件或包导入。
      3. 代码风格规范，逻辑清晰。
      4. 只返回代码内容，不要包含 Markdown 标记（例如 \`\`\`c ... \`\`\`），如果包含请去掉。
      
      题目描述:
      ${problemDescription}
    `;

        const responseText = await generateText(prompt);

        let code = responseText || "";
        // Cleanup markdown
        code = code.replace(/```[a-zA-Z]*\n/g, '').replace(/```/g, '').trim();
        return code;
    } catch (error) {
        console.error("AI Code Gen Error:", error);
        return "// AI 生成代码失败，请稍后重试或手动编写。";
    }
};

/**
 * Teacher: Parse multiple problems from raw text.
 */
export const smartParseBatchProblems = async (rawText: string, expectedCount?: number): Promise<any[]> => {
    try {
        const prompt = `分析以下文本并提取为 JSON 数组。
      
      **核心任务**:
      ${expectedCount ? `1. 【强约束】必须从文本中识别并分拆出 **${expectedCount}** 道题目。即使文本界限模糊，也请寻找最合理的切分点，确保返回 ${expectedCount} 个 JSON 对象。` : `1. 自动识别文本中的题目数量并进行分拆。`}
      2. **识别优先级**: 
         - A. 固定标签匹配（如“题目名称：”、“题目描述：”）。
         - B. Markdown 标题语义匹配（如“## 描述” -> description）。
         - C. 自行切分。
      3. **严禁返回空对象**: 必须确保提取出的 title、description 等字段有实际内容。
      4. **Markdown 格式化 (极其重要)**: 
         - 请对每道题的 'description' 进行深度排版。使用 **加粗** 来标记题目中的关键变量（如 **n**, **x**, **y**）。
         - 题目描述中的多个要求或步骤请使用 Markdown 列表进行拆解，不要堆在一坨。
         - 公式或约束条件请使用反引号 (\`\`) 包裹。
         - 提高可读性，确保输出内容结构化。
      待解析文本:
      ${rawText}`;

        const schema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING, description: "完整描述" },
                    difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] },
                    inputExample: { type: Type.STRING },
                    outputExample: { type: Type.STRING },
                    tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["title", "description", "difficulty"]
            }
        };

        const responseText = await generateText(
            prompt,
            "你是一个自动化数据录入助手。请必须严格按照提供的 JSON Schema 输出纯 JSON 数据，绝对不要包含任何其他说明文字或 Markdown 标记。",
            schema
        );

        const cleaned = cleanJsonString(responseText);
        return JSON.parse(cleaned);
    } catch (error) {
        console.error("AI Smart Batch Parse Error:", error);
        throw new Error("批量解析题目失败");
    }
};
