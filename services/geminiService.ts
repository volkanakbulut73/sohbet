
import { GoogleGenAI } from "@google/genai";
import { CHAT_MODULE_CONFIG } from "../config";

/**
 * Gemini AI Response Service
 * Adheres to @google/genai v1.x standards
 */
export const getGeminiResponse = async (prompt: string, context: string, imageBase64?: string, customInstruction?: string) => {
  try {
    const apiKey = process.env.API_KEY;

    // API Key Validation
    if (!apiKey || apiKey === "undefined" || apiKey === "" || apiKey.length < 5) {
      return "SİSTEM: API Anahtarı yapılandırılamadı. Lütfen sunucu ayarlarını kontrol edin veya AI Ayarları kısmından anahtar seçin.";
    }

    // Initialize GenAI with specific named parameter
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
      text: `PLATFORM_CONTEXT: ${context}\n\nUSER_MESSAGE: ${prompt}` 
    });

    /**
     * MODEL CHOICE:
     * Using 'gemini-flash-latest' as it's the most widely available stable alias.
     * Prevents 404 errors associated with preview or regional identifiers.
     */
    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: { parts },
      config: {
        systemInstruction: customInstruction || CHAT_MODULE_CONFIG.BOT_SYSTEM_INSTRUCTION,
        temperature: 1.0,
        topP: 0.95,
        topK: 64
      }
    });
    
    // SDK REQUIREMENT: .text is a GETTER property, NOT a method.
    const text = response.text;
    
    if (!text) {
      return "SİSTEM: AI şu an yanıt veremiyor (Boş Yanıt).";
    }
    
    return text;
  } catch (error: any) {
    console.error("Gemini Critical Error:", error);
    const errorMsg = error?.message || "";
    
    // Regional or Model ID 404 error
    if (errorMsg.includes("Requested entity was not found") || errorMsg.includes("404")) {
      return "HATA: Seçilen AI modeli (gemini-flash-latest) bu bölgede veya bu anahtar için aktif değil. Alternatif modele geçiş yapılamadı.";
    }

    // Rate Limiting 429
    if (errorMsg.includes("429") || errorMsg.includes("quota")) {
      return "SİSTEM: Kullanım limiti aşıldı. Lütfen bir süre sonra tekrar deneyin.";
    }

    // Unauthorized 403/401
    if (errorMsg.includes("401") || errorMsg.includes("403")) {
      return "HATA: Geçersiz API Anahtarı veya yetki sorunu.";
    }
    
    return `SİSTEM: AI Bağlantı Hatası (${errorMsg.substring(0, 40)}...)`;
  }
};
