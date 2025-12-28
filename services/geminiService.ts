
import { GoogleGenAI } from "@google/genai";

/**
 * Workigom Gemini AI Servisi
 * mIRC Operatörü Kişiliği ile Yapılandırıldı.
 */
export const geminiService = {
  async getChatResponse(prompt: string) {
    try {
      const apiKey = process.env.API_KEY;
      
      // API Key kontrolü (Sistem tarafından sağlanmalıdır)
      if (!apiKey) {
        console.error("Gemini API Key is missing in process.env");
        return "Sistem Mesajı: AI servisi şu an devre dışı (Konfigürasyon eksik).";
      }

      const ai = new GoogleGenAI({ apiKey });
      
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

      return response.text || "Pardon, bağlantı koptu sanırım. Ne demiştin?";
    } catch (error) {
      console.error("Gemini AI Error:", error);
      return "Sistem: Şu an yoğunum, biraz sonra tekrar dener misin? (Ping error)";
    }
  }
};
