
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const geminiService = {
  /**
   * Gemini'den cevap üretir.
   * @param prompt Kullanıcının mesajı
   * @param history Sohbet geçmişi (opsiyonel)
   */
  async getChatResponse(prompt: string, history: { role: string, parts: string[] }[] = []) {
    try {
      if (!process.env.API_KEY) {
        return "Sistem: Gemini API anahtarı yapılandırılmamış.";
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: `Sen Workigom Chat platformunda bir AI asistanısın. 
          Adın Gemini. mIRC/Geveze tarzı bir sohbet ortamındasın. 
          Kısa, öz, samimi ve bazen mIRC jargonunu (slm, nbr, tmm, as vb.) kullanan bir tarzın olsun. 
          Kullanıcılara yardımcı ol, onlarla şakalaş ama her zaman saygılı kal. 
          Mesajlarında çok fazla emoji kullanma, mIRC ruhunu koru.`,
          temperature: 0.7,
          topP: 0.95,
        },
      });

      return response.text || "Üzgünüm, şu an cevap veremiyorum.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Sistem: Gemini bağlantısında bir sorun oluştu.";
    }
  }
};
