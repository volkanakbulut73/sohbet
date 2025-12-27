
import { GoogleGenAI } from "@google/genai";
import { CHAT_MODULE_CONFIG } from "../config";

/**
 * Gemini AI Response Service
 * Optimized for Gemini 1.5/2.0 Series and @google/genai v1.x
 */
export const getGeminiResponse = async (prompt: string, context: string, imageBase64?: string, customInstruction?: string) => {
  try {
    const apiKey = process.env.API_KEY;

    // API anahtarı kontrolü
    if (!apiKey || apiKey === "undefined" || apiKey === "" || apiKey.length < 10) {
      return "HATA: API Anahtarı eksik. Lütfen Ayarlar -> AI Ayarları kısmından anahtarınızı bağlayın.";
    }

    // Google GenAI SDK v1.x standartlarına göre initialization
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
      text: `CONTEXT: ${context}\nUSER_PROMPT: ${prompt}` 
    });

    /**
     * MODEL SEÇİMİ:
     * 'gemini-flash-latest' en güncel ve kararlı flash modeline (1.5 Flash) yönlendirir.
     * 404 hatasını önlemek için en güvenli seçimdir.
     */
    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: { parts },
      config: {
        systemInstruction: customInstruction || CHAT_MODULE_CONFIG.BOT_SYSTEM_INSTRUCTION,
        temperature: 0.8,
        topP: 0.95,
      }
    });
    
    // SDK STANDARTI: .text bir mülkiyettir (getter), fonksiyon değildir.
    const text = response.text;
    
    if (!text) {
      return "SİSTEM: AI geçerli bir yanıt döndüremedi.";
    }
    
    return text;
  } catch (error: any) {
    console.error("Gemini Service Error:", error);
    const errorMsg = error?.message || "";
    
    // 404 Hatası Yönetimi (Model ID Hatası)
    if (errorMsg.includes("Requested entity was not found") || errorMsg.includes("404")) {
      return "HATA: Seçilen model (gemini-flash-latest) sunucuda bulunamadı. Lütfen API anahtarınızın model erişim yetkisini kontrol edin veya modeli 'gemini-2.0-flash-exp' olarak güncelleyin.";
    }

    // 403 Hatası (Yetki/Bölge)
    if (errorMsg.includes("403") || errorMsg.includes("permission")) {
      return "HATA: API Anahtarı yetkisiz veya bu bölgede kullanılamıyor.";
    }

    // 429 Hatası (Kota)
    if (errorMsg.includes("429") || errorMsg.includes("quota")) {
      return "SİSTEM: AI kullanım sınırı doldu. Lütfen 1 dakika bekleyin.";
    }
    
    return `SİSTEM: Teknik bir sorun oluştu (${errorMsg.substring(0, 50)}...)`;
  }
};
