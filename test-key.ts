import { GoogleGenAI } from "@google/genai";

const apiKey = "AIzaSyArNLGQu-Vy2KJp5acMzSK3sPgkZqhIoXY";

async function testModel(modelName: string) {
    console.log(`Testing model: ${modelName}...`);
    try {
        const ai = new GoogleGenAI({ apiKey });
        const model = ai.models.generateContent({
            model: modelName,
            contents: {
                parts: [{ text: "Hello" }]
            }
        });
        await model;
        console.log(`✅ ${modelName} is AVAILABLE.`);
        return true;
    } catch (error: any) {
        console.log(`❌ ${modelName} FAILED: ${error.message.split('\n')[0]}`);
        return false;
    }
}

async function runTests() {
    await testModel('gemini-1.5-pro');
    await testModel('gemini-2.0-flash-exp');
    await testModel('gemini-3-pro-image-preview');
    await testModel('gemini-2.5-flash-image');
}

runTests();
