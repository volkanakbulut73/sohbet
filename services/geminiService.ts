
import { GoogleGenAI } from "@google/genai";
import { CHAT_MODULE_CONFIG } from "../config";

export const getGeminiResponse = async (prompt: string, context: string, imageBase64?: string, customInstruction?: string) => {
  // Check if API key exists in environment
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined" || apiKey.length < 5) {
    return "Sistem Mesajı: Yapay Zeka anahtarı henüz yapılandırılmadı. Lütfen sağ üstteki ayarlardan veya Bot odasından 'AI Bağlan' butonuna tıklayın.";
  }

  try {
    // Create instance right before call to ensure we have the most current state
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
      text: `Platform: ${CHAT_MODULE_CONFIG.DOMAIN}\nBağlam: ${context}\nKullanıcı: ${prompt}` 
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts }],
      config: {
        systemInstruction: customInstruction || CHAT_MODULE_CONFIG.BOT_SYSTEM_INSTRUCTION,
        temperature: 0.7,
        topP: 0.9,
        topK: 40
      }
    });
    
    // Mandated direct .text property access
    const text = response.text;
    
    if (!text) {
      throw new Error("Boş yanıt döndü.");
    }
    
    return text;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    if (error.message?.includes("API key not valid") || error.message?.includes("not found")) {
      return "Hata: Geçersiz veya süresi dolmuş API anahtarı. Lütfen anahtarı yenileyin.";
    }
    
    return "Bağlantı Hatası: Workigom AI şu an meşgul, lütfen birkaç saniye sonra tekrar deneyin.";
  }
};
