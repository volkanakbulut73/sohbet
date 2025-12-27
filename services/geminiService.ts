
import { GoogleGenAI } from "@google/genai";
import { CHAT_MODULE_CONFIG } from "../config";

export const getGeminiResponse = async (prompt: string, context: string, imageBase64?: string, customInstruction?: string) => {
  try {
    /** 
     * KURAL: API anahtarı EXCLUSIVELY process.env.API_KEY üzerinden alınmalıdır.
     * Platform anahtarı enjekte ettiğinde bu değer güncellenecektir.
     */
    const apiKey = process.env.API_KEY;

    // GoogleGenAI instance'ı her çağrıda taze olarak oluşturulur (Kural gereği).
    const ai = new GoogleGenAI({ apiKey: apiKey || "" });
    
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
    
    // .text property'sine doğrudan erişim.
    const text = response.text;
    
    if (!text) {
      return "Sistem: Yanıt alınamadı. Lütfen tekrar deneyin.";
    }
    
    return text;
  } catch (error: any) {
    console.error("Workigom AI Service Error:", error);
    
    // API hatası durumunda mIRC tarzı bilgilendirme
    if (error.message?.includes("API_KEY_INVALID") || error.message?.includes("not found")) {
      return "HATA: AI servis bağlantısı kurulamadı. Lütfen üst menüden 'AI Yapılandırması'nı kontrol edin.";
    }
    
    return "SİSTEM: Şu an bir bağlantı sorunu yaşıyorum. Lütfen 30 saniye sonra tekrar deneyin.";
  }
};
