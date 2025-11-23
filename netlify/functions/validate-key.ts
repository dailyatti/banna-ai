import { Handler } from '@netlify/functions';
import { GoogleGenAI } from '@google/genai';

export const handler: Handler = async (event) => {
    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { apiKey } = JSON.parse(event.body || '{}');

        if (!apiKey) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing API Key' }) };
        }

        const ai = new GoogleGenAI({ apiKey });

        // Use a lightweight model for validation
        // gemini-2.0-flash-exp is a good candidate for speed
        const model = ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: {
                parts: [{ text: "Test" }],
            },
        });

        await model;

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ valid: true }),
        };

    } catch (error: any) {
        console.error("Validation Error:", error);
        return {
            statusCode: 200, // Return 200 but with valid: false to handle it gracefully in frontend
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ valid: false, error: error.message }),
        };
    }
};
