
import { GoogleGenAI } from "@google/genai";
import { CHAT_MODULE_CONFIG } from "../config";

/**
 * Gemini AI Yanıt Servisi
 * KURAL: API anahtarı her zaman taze 'process.env.API_KEY' üzerinden alınır.
 * KURAL: Gemini 3 modelleri ve .text özelliği kullanılır.
 */
export const getGeminiResponse = async (prompt: string, context: string, imageBase64?: string, customInstruction?: string) => {
  try {
    const apiKey = process.env.API_KEY;

    // Anahtar kontrolü - Eğer yoksa veya geçersizse 'Requested entity was not found' hatası döndürülür.
    // Bu hata App.tsx tarafından yakalanarak otomatik anahtar seçiciyi tetikler.
    if (!apiKey || apiKey === "undefined" || apiKey === "") {
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

    // KURAL: generateContent doğrudan model ismiyle çağrılır (gemini-3-flash-preview).
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
    
    // KURAL: .text bir özelliktir (getter), fonksiyon değildir.
    const text = response.text;
    
    if (!text) {
      return "SİSTEM: Yanıt üretilemedi. Lütfen tekrar deneyin.";
    }
    
    return text;
  } catch (error: any) {
    console.error("Gemini SDK Error:", error);
    
    const errorMsg = error?.message || "";
    
    // KURAL: API 'Requested entity was not found' hatası dönerse UI seçim ekranını açacaktır.
    if (errorMsg.includes("Requested entity was not found") || errorMsg.includes("404") || errorMsg.includes("API key not valid")) {
      return "HATA: Requested entity was not found. [INVALID_KEY] Lütfen anahtarınızı güncelleyin.";
    }

    if (errorMsg.includes("429") || errorMsg.includes("quota")) {
      return "SİSTEM: AI kullanım limitiniz doldu. Lütfen bir süre sonra deneyin.";
    }
    
    return "SİSTEM: Teknik bir sorun oluştu. Bağlantınızı veya anahtarınızı kontrol edin.";
  }
};
