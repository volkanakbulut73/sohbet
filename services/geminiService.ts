
import { GoogleGenAI } from "@google/genai";
import { CHAT_MODULE_CONFIG } from "../config";

/**
 * Gemini AI Yanıt Servisi
 * KURAL: API anahtarı her zaman taze 'process.env.API_KEY' üzerinden alınır.
 */
export const getGeminiResponse = async (prompt: string, context: string, imageBase64?: string, customInstruction?: string) => {
  try {
    const apiKey = process.env.API_KEY;

    // KURAL: Anahtar yoksa veya 'undefined' ise platformun beklediği hata dizinini döndürür.
    if (!apiKey || apiKey === "undefined" || apiKey === "") {
      return "SİSTEM: Requested entity was not found. [API_KEY_MISSING] Lütfen geçerli bir AI anahtarı seçin.";
    }

    // KURAL: Her istekte yeni bir GoogleGenAI instance'ı oluşturulmalıdır.
    const ai = new GoogleGenAI({ apiKey: apiKey });
    
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
    
    // KURAL: .text bir özelliktir (getter), fonksiyon olarak çağrılmaz (response.text() yanlıştır).
    const text = response.text;
    
    if (!text) {
      return "SİSTEM: Yanıt üretilemedi. Lütfen tekrar deneyin.";
    }
    
    return text;
  } catch (error: any) {
    console.error("Gemini SDK Error:", error);
    
    const errorMsg = error?.message || "";
    
    // KURAL: 'Requested entity was not found' hatası algılandığında bu mesajı dönerek UI'ın seçiciyi açmasını sağlar.
    if (errorMsg.includes("Requested entity was not found") || errorMsg.includes("404") || errorMsg.includes("API key not valid")) {
      return "SİSTEM: Requested entity was not found. [INVALID_KEY] Lütfen anahtarınızı güncelleyin.";
    }

    if (errorMsg.includes("429") || errorMsg.includes("quota")) {
      return "SİSTEM: AI kullanım limitine ulaşıldı. Lütfen daha sonra deneyin.";
    }
    
    return "SİSTEM: Teknik bir sorun oluştu. Bağlantıyı kontrol edin.";
  }
};
