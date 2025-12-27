
import { GoogleGenAI } from "@google/genai";
import { CHAT_MODULE_CONFIG } from "../config";

export const getGeminiResponse = async (prompt: string, context: string, imageBase64?: string, customInstruction?: string) => {
  try {
    // Directly initialize to capture the most current process.env.API_KEY state
    const ai = new GoogleGenAI({ 
      apiKey: process.env.API_KEY 
    });
    
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
      text: `Sistem/Kanal Bağlamı: ${context}\nKullanıcıdan Gelen Mesaj: ${prompt}` 
    });

    // Use array format for contents as it's standard for multiple parts/turns
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts }],
      config: {
        systemInstruction: customInstruction || CHAT_MODULE_CONFIG.BOT_SYSTEM_INSTRUCTION,
        temperature: 0.75,
        topP: 0.95,
        topK: 64
      }
    });
    
    // Direct property access as mandated (not a method call)
    const text = response.text;
    
    if (!text) {
      throw new Error("Empty response");
    }
    
    return text;
  } catch (error: any) {
    console.error("Workigom AI Error:", error);
    
    // Check for common error signatures
    const errorMsg = error.message || "";
    if (errorMsg.includes("API Key must be set") || errorMsg.includes("API key not valid")) {
      return "Sistem Hatası: Yapay Zeka yapılandırması eksik (API Key Hatası). Lütfen yöneticiye başvurun.";
    }
    
    return "Bağlantı Hatası: Workigom AI şu an yoğun veya yapılandırma bekliyor. Lütfen birkaç saniye sonra tekrar deneyin.";
  }
};
