
import { GoogleGenAI } from "@google/genai";
import { CHAT_MODULE_CONFIG } from "../config";

export const getGeminiResponse = async (prompt: string, context: string, imageBase64?: string, customInstruction?: string) => {
  try {
    // KURAL: API anahtarı her zaman taze process.env.API_KEY üzerinden alınmalıdır.
    const apiKey = process.env.API_KEY;

    // KURAL: Anahtar yoksa veya geçersizse 'Requested entity was not found' hatası dönülmelidir.
    if (!apiKey || apiKey === "undefined" || apiKey.length < 5) {
      return "HATA: Requested entity was not found. [API_KEY_MISSING] Lütfen geçerli bir AI anahtarı seçin.";
    }

    // KURAL: Her istekte yeni bir GoogleGenAI instance'ı oluşturulmalıdır.
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
    
    // .text özelliğine doğrudan erişim sağlanır.
    const text = response.text;
    
    if (!text) {
      return "SİSTEM: Yanıt üretilemedi, lütfen tekrar deneyin.";
    }
    
    return text;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    const errorMsg = error?.message || "";
    
    // KURAL: Eğer API 'Requested entity was not found' hatası dönerse UI seçim ekranını açacaktır.
    if (errorMsg.includes("Requested entity was not found") || errorMsg.includes("API key not valid")) {
      return "HATA: Requested entity was not found. [INVALID_KEY] Lütfen anahtarınızı güncelleyin.";
    }

    if (errorMsg.includes("429") || errorMsg.includes("quota")) {
      return "SİSTEM: AI kullanım limitiniz doldu. Lütfen bir süre sonra deneyin.";
    }
    
    return "SİSTEM: Teknik bir sorun oluştu. Bağlantınızı veya anahtarınızı kontrol edin.";
  }
};
