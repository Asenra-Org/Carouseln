import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const keyMatch = envFile.match(/PUBLIC_GEMINI_API_KEY=(.*)/);
if (keyMatch) {
    const key = keyMatch[1].trim();
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    console.log("Calling gemini-2.5-flash with a test prompt...");
    model.generateContent("Say hello world in one word")
        .then(result => {
            console.log("Response:", result.response.text());
        })
        .catch(e => {
            console.error("Error calling gemini-2.5-flash:", e);
        });
} else {
    console.log("No key found");
}
