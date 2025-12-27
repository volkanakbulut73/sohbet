
import { GoogleGenAI } from "@google/genai";
import { CHAT_MODULE_CONFIG } from "../config";

/**
 * Gemini AI Yanıt Servisi
 * KURAL: API anahtarı her zaman taze 'process.env.API_KEY' üzerinden alınır.
 */
export const getGeminiResponse = async (prompt: string, context: string, imageBase64?: string, customInstruction?: string) => {
  try {
    const apiKey = process.env.API_KEY;

    // Anahtar kontrolü - Eğer yoksa platformun beklediği hata dizinini döndürür.
    if (!apiKey || apiKey === "undefined") {
      return "HATA: Requested entity was not found. [API_KEY_MISSING] AI servisi için anahtar seçimi gerekiyor.";
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

    // KURAL: generateContent doğrudan model ismiyle çağrılır.
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
    
    // KURAL: .text özelliğine doğrudan erişim (metot değildir).
    const text = response.text;
    
    if (!text) {
      return "SİSTEM: Yanıt üretilemedi. Lütfen tekrar deneyin.";
    }
    
    return text;
  } catch (error: any) {
    console.error("Gemini SDK Error:", error);
    
    const errorMsg = error?.message || "";
    
    // KURAL: 'Requested entity was not found' hatası UI'ın seçim diyaloğunu tetiklemesi için kritiktir.
    if (errorMsg.includes("Requested entity was not found") || errorMsg.includes("404") || errorMsg.includes("API key not valid")) {
      return "HATA: Requested entity was not found. [INVALID_KEY] Lütfen geçerli bir anahtar seçin.";
    }

    if (errorMsg.includes("429") || errorMsg.includes("quota")) {
      return "SİSTEM: Kullanım limitine ulaşıldı. Lütfen bir süre sonra tekrar deneyin.";
    }
    
    return "SİSTEM: Bir hata oluştu. Bağlantınızı kontrol edin.";
  }
};
