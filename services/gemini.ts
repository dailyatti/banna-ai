import { GoogleGenAI } from "@google/genai";
import { AspectRatio } from "../types";

/**
 * edits or generates an image using Gemini
 */
export const generateEditedImage = async (
  base64Image: string,
  prompt: string,
  aspectRatio: AspectRatio,
  usePro: boolean
): Promise<{ url: string; mimeType: string }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Select model - Defaulting to Pro if requested, else Flash
    const model = usePro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

    const imageConfig: any = {
      aspectRatio: aspectRatio,
    };

    if (usePro) {
      imageConfig.imageSize = '2K';
    }

    // Default prompt if empty
    const effectivePrompt = prompt.trim() === "" 
      ? "Enhance the image quality, improve lighting, detail, and clarity while maintaining the original subject." 
      : prompt;

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: 'image/jpeg', 
            },
          },
          {
            text: effectivePrompt,
          },
        ],
      },
      config: {
        imageConfig: imageConfig,
      } as any,
    });

    const parts = response.candidates?.[0]?.content?.parts;

    if (!parts) {
      throw new Error("No content generated");
    }

    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        const base64Data = part.inlineData.data;
        const mimeType = part.inlineData.mimeType || 'image/png';
        return {
          url: `data:${mimeType};base64,${base64Data}`,
          mimeType: mimeType
        };
      }
    }

    const textPart = parts.find(p => p.text);
    if (textPart) {
      throw new Error(`Model refusal: ${textPart.text}`);
    }

    throw new Error("No image data found in response");

  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    throw new Error(error.message || "Failed to generate image");
  }
};