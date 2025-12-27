
import { GoogleGenAI } from "@google/genai";
import { CHAT_MODULE_CONFIG } from "../config";

export const getGeminiResponse = async (prompt: string, context: string, imageBase64?: string, customInstruction?: string) => {
  try {
    // Create new instance on every call to ensure the latest API Key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
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
      model: 'gemini-3-flash-preview',
      contents: [{ parts }],
      config: {
        systemInstruction: customInstruction || CHAT_MODULE_CONFIG.BOT_SYSTEM_INSTRUCTION,
        temperature: 0.7,
        topP: 0.95,
        topK: 40
      }
    });
    
    // Direct access to .text property as mandated
    const text = response.text;
    if (!text) {
      throw new Error("Boş yanıt döndü.");
    }
    return text;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // Handle specific API errors
    if (error.message?.includes("Requested entity was not found")) {
      return "Hata: Model bulunamadı veya API anahtarı geçersiz.";
    }
    return "Bağlantı hatası: Workigom AI şu an meşgul, lütfen birkaç saniye sonra tekrar deneyin.";
  }
};
