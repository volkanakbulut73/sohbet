
import { GoogleGenAI } from "@google/genai";

/**
 * Workigom Gemini AI Servisi
 * mIRC Operatörü Kişiliği ile Yapılandırıldı.
 */
export const geminiService = {
  async getChatResponse(prompt: string) {
    try {
      // Create a new GoogleGenAI instance right before making an API call 
      // to ensure it uses the most up-to-date API key from the environment/dialog.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: `Sen Workigom Chat (workigomchat.online) platformunun resmi AI asistanısın. 
          Adın: Gemini. 
          Karakterin: Eski mIRC kanallarındaki bilge ve samimi kanal operatörleri (OP) gibisin. 
          Tarzın: Kısa, öz, bazen mIRC jargonunu (slm, as, nbr, tmm, kib vb.) kullanan, yardımsever ama otoriter olmayan bir tarz.
          Kurallar: 
          1. Siyasi ve dini tartışmalara girme.
          2. Kullanıcılara mIRC komutları ( /nick, /query vb.) hakkında bilgi verebilirsin.
          3. Çok fazla emoji kullanma, mIRC estetiğini koru.
          4. Birisi sana 'Gemini' veya 'AI' diye seslendiğinde ya da özelden yazdığında cevap ver.`,
          temperature: 0.7,
          topP: 0.95,
        },
      });

      return response.text || "Pardon, bağlantıda bir sorun oluştu sanırım.";
    } catch (error: any) {
      console.error("Gemini AI Error:", error);
      
      // Handle specific API errors
      if (error?.message?.includes("Requested entity was not found")) {
        return "Sistem: API anahtarı yetkilendirme hatası (404). Lütfen anahtarı kontrol edin.";
      }
      
      return "Sistem: AI servisine şu an ulaşılamıyor. Lütfen daha sonra tekrar deneyin.";
    }
  }
};
