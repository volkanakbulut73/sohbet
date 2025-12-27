
import { GoogleGenAI } from "@google/genai";
import { CHAT_MODULE_CONFIG } from "../config";

export const getGeminiResponse = async (prompt: string, context: string, imageBase64?: string, customInstruction?: string) => {
  try {
    // KURAL: API anahtarı her zaman taze process.env.API_KEY üzerinden alınmalıdır.
    const apiKey = process.env.API_KEY;

    // Eğer anahtar yoksa UI'ın yakalayacağı spesifik bir hata kodu dönüyoruz.
    if (!apiKey || apiKey === "undefined") {
      return "HATA: [API_KEY_MISSING] Requested entity was not found. Lütfen AI anahtarınızı seçin.";
    }

    // KURAL: Her istekte yeni instance oluşturulmalıdır.
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
    
    // .text özelliğine doğrudan erişim.
    const text = response.text;
    
    if (!text) {
      return "SİSTEM: Yanıt üretilemedi, lütfen tekrar deneyin.";
    }
    
    return text;
  } catch (error: any) {
    console.error("Gemini API Connection Error:", error);
    
    const errorMsg = error?.message || "";
    
    // KURAL: 'Requested entity was not found' hatası gelirse UI seçim diyaloğunu tetiklemelidir.
    if (errorMsg.includes("Requested entity was not found") || errorMsg.includes("API key not valid")) {
      return "HATA: [INVALID_KEY] Requested entity was not found. Lütfen anahtarınızı güncelleyin.";
    }

    if (errorMsg.includes("429") || errorMsg.includes("quota")) {
      return "SİSTEM: Limitleriniz doldu. Lütfen bir süre bekleyin.";
    }
    
    return "SİSTEM: Teknik bir sorun oluştu. Lütfen bağlantınızı kontrol edin.";
  }
};
