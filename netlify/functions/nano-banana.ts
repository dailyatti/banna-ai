import { Handler } from '@netlify/functions';
import { GoogleGenAI } from '@google/genai';

export const handler: Handler = async (event) => {
    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { apiKey, imageBase64, prompt, aspectRatio } = JSON.parse(event.body || '{}');

        if (!apiKey) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing API Key' }) };
        }

        if (!imageBase64) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing Image Data' }) };
        }

        const ai = new GoogleGenAI({ apiKey });

        // Using Pro model exclusively - gemini-3-pro-image
        const modelName = 'gemini-3-pro-image';

        // Build aspect ratio description for the prompt
        const aspectRatioDescriptions: { [key: string]: string } = {
            '1:1': 'square format (1:1 aspect ratio)',
            '3:4': 'portrait format (3:4 aspect ratio)',
            '4:3': 'landscape format (4:3 aspect ratio)',
            '9:16': 'vertical mobile format (9:16 aspect ratio)',
            '16:9': 'widescreen landscape format (16:9 aspect ratio)'
        };

        const aspectRatioDesc = aspectRatioDescriptions[aspectRatio] || `${aspectRatio} aspect ratio`;

        // Pro model configuration - 4K quality with 2K image size
        const imageConfig: any = {
            aspectRatio: aspectRatio,
            imageSize: '2K' // Pro model supports up to 4K
        };

        // Build effective prompt with explicit aspect ratio instruction
        let effectivePrompt = '';
        if (prompt && prompt.trim()) {
            effectivePrompt = `Generate a new professional-quality image in ${aspectRatioDesc} based on this image. ${prompt}`;
        } else {
            effectivePrompt = `Generate a new professional-quality image in ${aspectRatioDesc} based on this image. Maintain the subject and composition but adapt it perfectly to the new ${aspectRatioDesc} format. Enhance lighting, colors, and overall quality while ensuring the image fills the entire ${aspectRatioDesc} frame.`;
        }

        // Generate with Pro model
        const response = await ai.models.generateContent({
            model: modelName,
            contents: {
                parts: [
                    { inlineData: { data: imageBase64, mimeType: 'image/jpeg' } },
                    { text: effectivePrompt },
                ],
            },
            config: { imageConfig: imageConfig } as any,
        });

        // Extract the image from the response
        // The structure depends on the SDK version, but typically it's in candidates[0].content.parts[0].inlineData
        // Or sometimes directly if it's a helper.
        // Let's inspect the response structure based on previous knowledge or assume standard.
        // Actually, the SDK returns a response object that might have a helper.
        // But let's look at how it was done in the client code:
        // const result = response.response.candidates[0].content.parts[0].inlineData.data;
        // Wait, the SDK usage in client was:
        // const response = await ai.models.generateContent(...)
        // const result = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

        const generatedImage = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

        if (!generatedImage) {
            throw new Error("No image generated in response");
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: generatedImage }),
        };

    } catch (error: any) {
        console.error("Function Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message || "Internal Server Error" }),
        };
    }
};
