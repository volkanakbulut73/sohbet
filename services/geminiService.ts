
import { GoogleGenAI } from "@google/genai";
import { CHAT_MODULE_CONFIG } from "../config";

export const getGeminiResponse = async (prompt: string, context: string, imageBase64?: string, customInstruction?: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
    // Model selection based on task type: Basic Text Task
    const model = 'gemini-3-flash-preview';
    
    const parts: any[] = [];
    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64.split(',')[1]
        }
      });
    }
    
    parts.push({ text: `Bağlam: ${context}\nKullanıcı: ${prompt}` });

    const response = await ai.models.generateContent({
      model: model,
      contents: [{ parts }],
      config: {
        systemInstruction: customInstruction || CHAT_MODULE_CONFIG.BOT_SYSTEM_INSTRUCTION,
        temperature: 0.7,
        topP: 0.95,
        topK: 40
      }
    });
    
    // Direct access to .text property as per guidelines
    const text = response.text;
    return text || "Şu an bağlantı kurulamıyor, lütfen tekrar deneyin.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Bağlantı hatası: Workigom AI şu an meşgul veya yapılandırma bekliyor.";
  }
};
