
import { sequelize } from '../config/database';
import Problem from '../models/Problem';
import KnowledgeNode from '../models/KnowledgeNode';
import { GoogleGenAI } from "@google/genai"; // Correct import for v0.1+
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.join(__dirname, '../../../.env.local') });

const autoTag = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const problems = await Problem.findAll();
        const nodes = await KnowledgeNode.findAll();

        // Simpified map: "loop_structure" (id) -> "循环结构" (name)
        const nodeMap = nodes.map(n => `${n.id} (${n.name})`).join(', ');

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('GEMINI_API_KEY not found!');
            return;
        }

        const ai = new GoogleGenAI({ apiKey });

        console.log(`Analyzing ${problems.length} problems...`);

        for (const p of problems) {
            if (p.tags && Array.isArray(p.tags) && p.tags.length > 0) {
                console.log(`Skipping ${p.title} (already tagged)`);
                continue;
            }

            console.log(`Tagging: ${p.title}...`);

            const prompt = `
            You are an expert Computer Science educator.
            Analyze the following coding problem and assign it relevant knowledge tags from the provided list.
            
            Valid Tags List: [${nodes.map(n => n.id).join(', ')}]
            (Descriptions: ${nodes.map(n => `${n.id}:${n.name}`).join('; ')})

            Problem Title: ${p.title}
            Problem Description: ${p.description.substring(0, 500)}... (truncated)

            Task:
            Return ONLY a valid JSON array of strings containing 1 to 3 tag IDs that best match this problem.
            Example: ["loop_structure", "array_basics"]
            Do not include markdown formatting or extra text.
            `;

            try {
                const result = await ai.models.generateContent({
                    model: "gemini-2.0-flash-exp",
                    contents: prompt,
                });
                const responseCode = result.text;
                const response = responseCode || "";
                // Clean markdown if present
                const cleanJson = response.replace(/```json/g, '').replace(/```/g, '').trim();
                const tags = JSON.parse(cleanJson);

                if (Array.isArray(tags)) {
                    // Filter invalid tags just in case
                    const validTags = tags.filter(t => nodes.some(n => n.id === t));

                    if (validTags.length > 0) {
                        await p.update({ tags: validTags });
                        console.log(`  -> Assigned: ${validTags.join(', ')}`);
                    } else {
                        console.log('  -> No valid tags found by AI.');
                    }
                }
            } catch (err) {
                console.error(`  -> Failed to tag ${p.title}:`, err);
                // Continue to next problem
            }

            // Simple rate limit protection
            await new Promise(r => setTimeout(r, 1000));
        }

        console.log('Auto-tagging completed.');
        process.exit(0);

    } catch (error) {
        console.error('Script failed:', error);
        process.exit(1);
    }
};

autoTag();
