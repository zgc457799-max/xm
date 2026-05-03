import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, ".env") });

const apiKey = process.env.GEMINI_API_KEY || '';
// Try WITHOUT baseURL
const ai = new GoogleGenAI({ apiKey } as any);

const modelsToTest = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro',
    'gemini-1.0-pro'
];

async function testModels() {
    for (const modelName of modelsToTest) {
        try {
            console.log(`Testing model: ${modelName}...`);
            const response = await ai.models.generateContent({
                model: modelName,
                contents: [{ role: 'user', parts: [{ text: 'Hello' }] }]
            });
            console.log(`✅ Success with ${modelName}!`);
            console.log("Response:", response.text);
            return; // Exit if one works
        } catch (error: any) {
            console.error(`❌ Failed with ${modelName}: ${error.message}`);
        }
    }
}

testModels();
