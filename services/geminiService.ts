
import { GoogleGenAI } from "@google/genai";

export type BotType = 'gemini' | 'lara';

/**
 * Workigom Gemini AI Servisi
 * mIRC Operatörü ve Asistan bot kişilikleri.
 * Google AI Studio Free Tier ile uyumludur.
 */
export const geminiService = {
  async getChatResponse(prompt: string, botType: BotType = 'gemini') {
    try {
      const apiKey = process.env.API_KEY;
      
      if (!apiKey) {
        return `[SİSTEM]: Şu an cevap veremiyorum çünkü bir API anahtarı seçilmemiş. 
        Sağ üstteki "AI OFF" butonuna tıklayıp ücretsiz bir anahtar seçersen sana yardımcı olabilirim!`;
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const instructions = {
        gemini: `Sen Workigom Chat üzerindeki 'Gemini' nickli operatörsün (IRCOp). 
          - Eski mIRC jargonu kullan (slm, aslanım, @ işaretli op gibi davran).
          - Cevapların kısa ve öz olsun. Otoriter ama samimi bir operatör ol.
          - Sadece Türkçe cevap ver.`,
        lara: `Sen Workigom Chat üzerindeki 'Lara' nickli asistan botsun. 
          - Çok nazik, yardımsever ve neşeli bir kadın asistan gibi davran.
          - Kullanıcılara kanal kuralları ve mIRC nostaljisi hakkında bilgi ver.
          - "Selam" verenlere sıcak karşılıklar ver. "Yardım" isteyenlere rehberlik et.`
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: instructions[botType],
          temperature: 0.8,
        },
      });

      return response.text || "Şu an cevap veremiyorum, lag var galiba...";
    } catch (error: any) {
      console.error(`Gemini API Error [${botType}]:`, error);
      if (error.message?.includes('429')) {
        return "Sistem Mesajı: Çok fazla soru sordun aslanım, ücretsiz kota doldu. Biraz bekle (Quota Exceeded).";
      }
      return "Sistem Mesajı: Bağlantı sorunu yaşanıyor (Lag/Ping).";
    }
  }
};
