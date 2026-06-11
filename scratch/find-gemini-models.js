import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const keyMatch = envFile.match(/PUBLIC_GEMINI_API_KEY=(.*)/);
if (keyMatch) {
    const key = keyMatch[1].trim();
    fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`)
        .then(r => r.json())
        .then(d => {
            if (d.models) {
                const geminiModels = d.models
                    .map(m => m.name)
                    .filter(name => name.includes("gemini"));
                console.log("Available Gemini Models:\n", geminiModels.join("\n"));
            } else {
                console.log("No models returned:", d);
            }
        }).catch(e => console.error(e));
} else {
    console.log("No key found");
}
