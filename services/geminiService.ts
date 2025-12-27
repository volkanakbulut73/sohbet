
import { GoogleGenAI } from "@google/genai";
import { CHAT_MODULE_CONFIG } from "../config";

export const getGeminiResponse = async (prompt: string, context: string, imageBase64?: string, customInstruction?: string) => {
  try {
    // KURAL: API anahtarını her zaman güncel process.env.API_KEY üzerinden al.
    const apiKey = process.env.API_KEY;

    if (!apiKey || apiKey === "undefined") {
      return "HATA: [API_KEY_MISSING] Lütfen üst menüden 'AI Yapılandırması'nı seçerek geçerli bir anahtar bağlayın.";
    }

    // KURAL: Her çağrıda yeni bir instance oluştur.
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
      text: `PLATFORM: ${CHAT_MODULE_CONFIG.DOMAIN}\nKANAL BAĞLAMI: ${context}\nKULLANICI MESAJI: ${prompt}` 
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
    
    const text = response.text;
    
    if (!text) {
      return "SİSTEM: Yanıt boş döndü. Lütfen tekrar deneyin.";
    }
    
    return text;
  } catch (error: any) {
    console.error("Gemini API Error Detail:", error);
    
    const errorMsg = error?.message || "";
    
    // KURAL: "Requested entity was not found" hatası anahtarın geçersiz olduğunu gösterir.
    if (errorMsg.includes("Requested entity was not found") || errorMsg.includes("API key not valid")) {
      return "HATA: [INVALID_KEY] Seçtiğiniz API anahtarı geçersiz veya yetkisiz. Lütfen ücretli bir GCP projesine ait anahtar seçin.";
    }

    if (errorMsg.includes("429") || errorMsg.includes("quota")) {
      return "SİSTEM: API kullanım kotanız doldu. Lütfen bir süre bekleyin veya farklı bir anahtar kullanın.";
    }
    
    return "SİSTEM: Bağlantı hatası oluştu. Lütfen internet bağlantınızı ve API anahtarınızı kontrol edin.";
  }
};
