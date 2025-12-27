
import { GoogleGenAI } from "@google/genai";
import { CHAT_MODULE_CONFIG } from "../config";

/**
 * Gemini AI Response Service
 * Optimized for stable performance and 404 prevention.
 */
export const getGeminiResponse = async (prompt: string, context: string, imageBase64?: string, customInstruction?: string) => {
  try {
    const apiKey = process.env.API_KEY;

    // API Key Validation - Consistent with system standards
    if (!apiKey || apiKey === "undefined" || apiKey === "" || apiKey.length < 5) {
      return "SİSTEM: API Anahtarı bulunamadı. Lütfen sağ üstteki ayarlardan AI anahtarınızı seçin.";
    }

    // Initialize GenAI exactly as per system instructions
    const ai = new GoogleGenAI({ apiKey });
    
    const parts: any[] = [];
    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64.split(',')[1]
        }
      });
    }
    
    parts.push({ 
      text: `SYSTEM_CONTEXT: ${context}\n\nUSER_INPUT: ${prompt}` 
    });

    /**
     * Using 'gemini-flash-latest' to ensure stability and avoid 404s.
     * This alias resolves to the most appropriate stable model for the region/key.
     */
    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: { parts },
      config: {
        systemInstruction: customInstruction || CHAT_MODULE_CONFIG.BOT_SYSTEM_INSTRUCTION,
        temperature: 0.9,
        topP: 0.95,
      }
    });
    
    // CRITICAL: .text is a property (getter), not a function, per system guidelines.
    const text = response.text;
    
    if (!text) {
      return "SİSTEM: AI geçerli bir yanıt oluşturamadı.";
    }
    
    return text;
  } catch (error: any) {
    console.error("Gemini SDK Error:", error);
    const errorMsg = error?.message || "";
    
    // Handle 404 (Model ID Issues)
    if (errorMsg.includes("Requested entity was not found") || errorMsg.includes("404")) {
      return "HATA: 'gemini-flash-latest' modeli bu anahtar ile erişilebilir değil. Lütfen API anahtarınızın faturalandırma durumunu kontrol edin.";
    }

    // Handle 429 (Quota)
    if (errorMsg.includes("429") || errorMsg.includes("quota")) {
      return "SİSTEM: Hız sınırı aşıldı. Lütfen biraz bekleyin.";
    }

    // Handle 401/403 (Auth)
    if (errorMsg.includes("401") || errorMsg.includes("403")) {
      return "HATA: API Anahtarı geçersiz veya yetkisiz.";
    }
    
    return `SİSTEM: AI Bağlantı Hatası (${errorMsg.substring(0, 50)}...)`;
  }
};
