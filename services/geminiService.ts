import { GoogleGenAI } from "@google/genai";
import { CHAT_MODULE_CONFIG } from "../config";

export const getGeminiResponse = async (prompt: string, context: string, imageBase64?: string, customInstruction?: string) => {
  try {
    // KURAL: API anahtarını doğrudan process.env.API_KEY üzerinden al
    // Not: Bazı ortamlarda anahtar build sırasında enjekte edilir.
    const apiKey = process.env.API_KEY;

    if (!apiKey || apiKey === "undefined") {
      return "Sistem Mesajı: Workigom AI şu an çevrimdışı (API Key yapılandırması bekleniyor). Lütfen daha sonra tekrar deneyin.";
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Creating content parts based on the multi-part example in the documentation
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

    // Gemini 3 Flash modelini kullanıyoruz. Contents yapısı parts array'ini içerecek şekilde düzenlendi.
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
    
    // Doğrudan .text property'sine erişim (Kural gereği metod olarak çağrılmaz)
    const text = response.text;
    
    if (!text) {
      return "Üzgünüm, şu an yanıt veremiyorum. Lütfen tekrar deneyin.";
    }
    
    return text;
  } catch (error: any) {
    console.error("Workigom AI Connection Error:", error);
    
    // mIRC tarzı hata mesajları
    if (error.message?.includes("API key")) {
      return "HATA: Servis bağlantısı kurulamadı. Lütfen yönetici (@Admin) ile iletişime geçin.";
    }
    
    return "SUNUCU MEŞGUL: Şu an çok fazla talep alıyorum, lütfen 15 saniye sonra tekrar deneyin.";
  }
};