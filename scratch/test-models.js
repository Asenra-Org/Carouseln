import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const keyMatch = envFile.match(/PUBLIC_GEMINI_API_KEY=(.*)/);
if (keyMatch) {
    const key = keyMatch[1].trim();
    fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`)
        .then(r => r.json())
        .then(d => {
            if (d.models) {
                const names = d.models
                  .filter(m => m.supportedGenerationMethods.includes('generateContent'))
                  .map(m => m.name);
                console.log("Supported generateContent models:", names);
            } else {
                console.log("Response:", d);
            }
        }).catch(e => console.error(e));
} else {
    console.log("No key found");
}
