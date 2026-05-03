import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, ".env") });

const apiKey = process.env.GEMINI_API_KEY || '';
// Try WITHOUT baseURL first to see if it fixes the 404
const ai = new GoogleGenAI({ apiKey } as any);

async function testGenerate() {
    try {
        console.log("Testing generation with gemini-1.5-flash (No baseURL)...");
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: [{ role: 'user', parts: [{ text: 'Hello, are you there?' }] }]
        });
        console.log("Success!");
        console.log("Response:", response.text);
    } catch (error: any) {
        console.error("Error:", error.message);

        console.log("\nTesting generation WITH baseURL...");
        const aiWithUrl = new GoogleGenAI({ apiKey, baseURL: process.env.GEMINI_BASE_URL } as any);
        try {
            const response2 = await aiWithUrl.models.generateContent({
                model: 'gemini-1.5-flash',
                contents: [{ role: 'user', parts: [{ text: 'Hello, are you there?' }] }]
            });
            console.log("Success with baseURL!");
            console.log("Response:", response2.text);
        } catch (error2: any) {
            console.error("Error with baseURL:", error2.message);
        }
    }
}

testGenerate();
