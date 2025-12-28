
import { GoogleGenAI } from "@google/genai";

export const geminiService = {
  /**
   * Gemini'den cevap üretir.
   */
  async getChatResponse(prompt: string) {
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) {
        return "Sistem: Gemini API anahtarı yapılandırılmamış.";
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: `Sen Workigom Chat platformunda bir AI asistanısın. 
          Adın Gemini. mIRC/Geveze tarzı bir sohbet ortamındasın. 
          Kısa, öz, samimi ve bazen mIRC jargonunu (slm, nbr, tmm, as vb.) kullanan bir tarzın olsun. 
          Kullanıcılara yardımcı ol, onlarla şakalaş ama her zaman saygılı kal. 
          Mesajlarında çok fazla emoji kullanma, mIRC ruhunu koru. 
          Cevapların sanki bir mIRC kanalı yöneticisi (OP) gibi olsun.`,
          temperature: 0.8,
          topP: 0.9,
        },
      });

      return response.text || "Üzgünüm, şu an cevap veremiyorum.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Sistem: Gemini şu an meşgul veya bağlantı hatası oluştu.";
    }
  }
};
