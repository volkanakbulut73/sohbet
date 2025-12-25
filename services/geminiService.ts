
import { GoogleGenAI } from "@google/genai";
import { CHAT_MODULE_CONFIG } from "../config";

export const getGeminiResponse = async (prompt: string, context: string, imageBase64?: string, customInstruction?: string) => {
  try {
    // API Key must be obtained exclusively from process.env.API_KEY
    const apiKey = process.env.API_KEY || "";
    
    if (!apiKey) {
      console.warn("API Key bulunamadı.");
      return "Sistem hatası: Yapay zeka yapılandırması eksik.";
    }

    const ai = new GoogleGenAI({ apiKey });
    // Using the recommended model for basic text/chat tasks
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
    
    return response.text || "Üzgünüm, şu an yanıt veremiyorum.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Bağlantı hatası: Sistem şu an meşgul.";
  }
};
