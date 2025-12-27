
import { GoogleGenAI } from "@google/genai";
import { CHAT_MODULE_CONFIG } from "../config";

/**
 * Gemini AI Response Service
 * Optimized for Workigom Chat Online
 */
export const getGeminiResponse = async (prompt: string, context: string, imageBase64?: string, customInstruction?: string) => {
  try {
    const apiKey = process.env.API_KEY;

    // KURAL: Anahtar yoksa platformun beklediği hata dizinini döndürür.
    if (!apiKey || apiKey === "undefined" || apiKey === "") {
      return "SİSTEM: Requested entity was not found. [API_KEY_MISSING] Lütfen geçerli bir AI anahtarı seçin.";
    }

    // KURAL: Her istekte yeni bir instance oluşturulmalıdır.
    const ai = new GoogleGenAI({ apiKey });
    
    const parts = [];
    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64.split(',')[1]
        }
      });
    }
    
    parts.push({ 
      text: `PLATFORM: ${CHAT_MODULE_CONFIG.DOMAIN}\nCONTEXT: ${context}\nUSER: ${prompt}` 
    });

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
    
    // .text is a property, not a method
    const text = response.text;
    
    if (!text) {
      return "SİSTEM: Yanıt üretilemedi. Lütfen tekrar deneyin.";
    }
    
    return text;
  } catch (error: any) {
    console.error("Gemini SDK Error:", error);
    const errorMsg = error?.message || "";
    
    if (errorMsg.includes("Requested entity was not found") || errorMsg.includes("404") || errorMsg.includes("API key not valid")) {
      return "SİSTEM: Requested entity was not found. [INVALID_KEY] Lütfen anahtarınızı güncelleyin.";
    }

    if (errorMsg.includes("429") || errorMsg.includes("quota")) {
      return "SİSTEM: AI kullanım limitine ulaşıldı. Lütfen daha sonra deneyin.";
    }
    
    return "SİSTEM: Teknik bir sorun oluştu. Bağlantıyı kontrol edin.";
  }
};
