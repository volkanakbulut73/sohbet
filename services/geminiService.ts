
import { GoogleGenAI } from "@google/genai";

export type BotType = 'gemini' | 'lara';

/**
 * Workigom Gemini AI Servisi
 * mIRC Operatörü ve Asistan bot kişilikleri.
 */
export const geminiService = {
  async getChatResponse(prompt: string, botType: BotType = 'gemini') {
    try {
      const apiKey = process.env.API_KEY;
      
      if (!apiKey) {
        return `[BİLGİ]: Üzgünüm, şu an sana cevap veremiyorum çünkü sistemimde bir API ANAHTARI tanımlı değil. 
        Google AI Studio'dan alacağın ÜCRETSİZ bir anahtar ile beni tekrar aktif edebilirsin. 
        Sağ üstteki "AI OFF" butonuna tıkla ve projeni seç! (Google AI Studio Free Tier ile tamamen ücretsizdir).`;
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const instructions = {
        gemini: `Sen Workigom Chat üzerindeki 'Gemini' nickli operatörsün (IRCOp).
          Kişilik:
          - Eski mIRC jargonu kullan (slm, aslanım, @ işaretli op gibi davran).
          - Cevapların kısa ve öz olsun. Otoriter bir kanal operatörü gibi konuş.
          - Sadece Türkçe cevap ver.`,
        lara: `Sen Workigom Chat üzerindeki 'Lara' nickli asistan botsun.
          Kişilik:
          - Çok nazik, yardımsever ve neşeli bir genç kadın asistan gibi davran.
          - Kullanıcılara kanal kuralları, sohbetin güvenliği ve Workigom hakkında bilgi ver.
          - mIRC nostaljisini sev ama modern ve kibar bir dil kullan.
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
        return "Sistem Mesajı: Çok fazla soru sordun aslanım, biraz dinlen (Quota Exceeded). Ücretsiz kota doldu.";
      }
      return "Sistem Mesajı: Bağlantı sorunu yaşanıyor (Lag/Ping).";
    }
  }
};
