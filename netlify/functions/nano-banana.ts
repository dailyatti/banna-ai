import { Handler } from '@netlify/functions';
import { GoogleGenAI } from '@google/genai';

export const handler: Handler = async (event) => {
    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { apiKey, imageBase64, prompt, aspectRatio, usePro } = JSON.parse(event.body || '{}');

        if (!apiKey) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing API Key' }) };
        }

        if (!imageBase64) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing Image Data' }) };
        }

        const ai = new GoogleGenAI({ apiKey });

        // Select model - Defaulting to Pro if requested, else Flash
        // Using the specific preview models as requested by the user
        const modelName = usePro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

        // Configuration for the model
        const imageConfig: any = {
            aspectRatio: aspectRatio,
            imageSize: usePro ? '2K' : undefined // Only for Pro model
        };

        const effectivePrompt = prompt || "Enhance this image with a professional studio look, keeping the original composition but improving lighting and detail.";

        const model = ai.models.generateContent({
            model: modelName,
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: imageBase64,
                            mimeType: 'image/jpeg',
                        },
                    },
                    {
                        text: effectivePrompt,
                    },
                ],
            },
            config: {
                // @ts-ignore - imageConfig is not yet in the types for some versions
                imageConfig: imageConfig,
            } as any,
        });

        const response = await model;

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
