
import { GoogleGenAI } from "@google/genai";
import { CHAT_MODULE_CONFIG } from "../config";

export const getGeminiResponse = async (prompt: string, context: string, imageBase64?: string, customInstruction?: string) => {
  try {
    // Initializing directly before call as mandated to ensure latest API key
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
    
    parts.push({ text: `Kanal/Sohbet Bağlamı: ${context}\nKullanıcı Mesajı: ${prompt}` });

    // FIX: Changed contents from [{ parts }] to { parts } to match single-turn Content object requirement
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        systemInstruction: customInstruction || CHAT_MODULE_CONFIG.BOT_SYSTEM_INSTRUCTION,
        temperature: 0.8,
        topP: 0.95,
        topK: 64
      }
    });
    
    // Safely extract text property
    const text = response.text;
    
    if (!text) {
      return "Sistem bir yanıt üretemedi. Lütfen tekrar deneyin.";
    }
    
    return text;
  } catch (error: any) {
    console.error("Workigom AI Connection Error:", error);
    
    // Graceful error messages based on common failures
    if (error.message?.includes("API key not valid")) {
      return "Sistem Hatası: API Anahtarı doğrulanamadı. Lütfen yöneticiye başvurun.";
    }
    
    return "Bağlantı Hatası: Workigom AI şu an yoğun veya bir ağ sorunu yaşıyor. Lütfen mesajınızı tekrar göndermeyi deneyin.";
  }
};
