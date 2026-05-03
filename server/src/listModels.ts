import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, ".env") });

const apiKey = process.env.GEMINI_API_KEY || '';
const baseURL = process.env.GEMINI_BASE_URL || undefined;

const ai = new GoogleGenAI({ apiKey, baseURL } as any);

async function listModels() {
    try {
        console.log("Fetching models...");
        // SDK logic to list models, assuming it follows the patterns
        const models = await (ai as any).models.list();
        console.log("Available Models:");
        console.log(JSON.stringify(models, null, 2));
    } catch (error: any) {
        console.error("Error listing models:", error.message);
        if (error.response) {
            console.error("Response data:", error.response.data);
        }
    }
}

listModels();
