import { GoogleGenAI } from "@google/genai";

const apiKey = "AIzaSyArNLGQu-Vy2KJp5acMzSK3sPgkZqhIoXY";

async function testKey() {
    console.log("Testing API key...");
    try {
        const ai = new GoogleGenAI({ apiKey });
        const model = ai.models.generateContent({
            model: 'gemini-2.0-flash-exp', // Using a flash model for quick test
            contents: {
                parts: [{ text: "Hello, are you working?" }]
            }
        });

        console.log("Request sent...");
        const response = await model;
        console.log("Response received!");
        console.log(response.candidates?.[0]?.content?.parts?.[0]?.text);
        console.log("API Key is VALID.");
    } catch (error) {
        console.error("API Key Verification Failed:", error);
    }
}

testKey();
