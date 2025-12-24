
import { GoogleGenAI } from "@google/genai";
import { CHAT_MODULE_CONFIG } from "../config";

export const getGeminiResponse = async (prompt: string, context: string, imageBase64?: string, customInstruction?: string) => {
  try {
    // Vite ortamında veya global process nesnesinde key ara
    const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (window as any).process?.env?.API_KEY || "";
    
    if (!apiKey) {
      console.warn("API Key bulunamadı. Lütfen yapılandırmayı kontrol edin.");
      return "Sistem hatası: Yapay zeka anahtarı yapılandırılmamış.";
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = "gemini-3-flash-preview";
    
    let parts: any[] = [];
    
    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64.split(',')[1]
        }
      });
    }
    
    parts.push({ text: `Kanal/Sohbet Bağlamı: ${context}\nKullanıcı Mesajı: ${prompt}` });

    const response = await ai.models.generateContent({
      model,
      contents: [{ parts }],
      config: {
        systemInstruction: customInstruction || CHAT_MODULE_CONFIG.BOT_SYSTEM_INSTRUCTION,
        temperature: 0.7,
        topP: 0.95,
        topK: 40
      }
    });
    
    return response.text || "Üzgünüm, bu isteği şu an işleyemiyorum.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Bağlantı hatası: Bot şu an meşgul.";
  }
};
