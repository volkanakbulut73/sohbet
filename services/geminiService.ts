
import { GoogleGenAI } from "@google/genai";
import { CHAT_MODULE_CONFIG } from "../config";

export const getGeminiResponse = async (prompt: string, context: string, imageBase64?: string, customInstruction?: string) => {
  try {
    // API Key must be obtained exclusively from process.env.API_KEY
    // Fix: Using the direct named parameter initialization as required by guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Using the recommended model for basic text/chat tasks
    const model = "gemini-3-flash-preview";
    
    const parts: any[] = [];
    
    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64.split(',')[1]
        }
      });
    }
    
    parts.push({ text: `Kanal/Sohbet Bağlamı: ${context}\nKullanıcı Mesajı: ${prompt}` });

    // Fix: Using correct GenerateContentParameters structure with contents.parts
    const response = await ai.models.generateContent({
      model,
      contents: { parts },
      config: {
        systemInstruction: customInstruction || CHAT_MODULE_CONFIG.BOT_SYSTEM_INSTRUCTION,
        temperature: 0.7,
        topP: 0.95,
        topK: 40
      }
    });
    
    // Fix: Using .text property directly (not a method) from GenerateContentResponse
    return response.text || "Üzgünüm, şu an yanıt veremiyorum.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Bağlantı hatası: Sistem şu an meşgul.";
  }
};
