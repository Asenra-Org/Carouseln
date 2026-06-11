import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
const apiKey = ""; // Read from .env instead
// Actually, let me just read from .env

const envFile = fs.readFileSync('.env', 'utf-8');
const keyMatch = envFile.match(/PUBLIC_GEMINI_API_KEY=(.*)/);
if (keyMatch) {
    const key = keyMatch[1].trim();
    const genAI = new GoogleGenerativeAI(key);
    // Actually, ModelService.ListModels is not exposed directly in this SDK version maybe? Let's use fetch.
    fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`)
        .then(r => r.json())
        .then(d => {
            console.log(JSON.stringify(d, null, 2));
        }).catch(e => console.error(e));
} else {
    console.log("No key found");
}
