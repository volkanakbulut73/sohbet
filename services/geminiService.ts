
import { GoogleGenAI } from "@google/genai";

/**
 * Workigom Gemini AI Servisi
 * mIRC Operatörü Kişiliği ile Yapılandırıldı.
 */
export const geminiService = {
  async getChatResponse(prompt: string) {
    try {
      // API Key'i her seferinde ortam değişkeninden taze olarak al
      const apiKey = process.env.API_KEY;
      
      if (!apiKey) {
        // Eğer anahtar yoksa, kullanıcıya butona basması gerektiğini bildir
        return "HATA: API anahtarı seçilmedi. Lütfen sağ üstteki 'AI KEY SEÇ' butonuna tıklayarak bir proje seçin.";
      }

      // Her çağrıda yeni instance oluştur (Platform kuralı: up-to-date key)
      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: `Sen Workigom Chat üzerindeki 'Gemini' nickli operatörsün (IRCOp).
          
          Kişilik:
          - Eski mIRC jargonu kullan (slm, aslanım, lag var, ping yüksek, @ işaretli op gibi davran).
          - Cevapların kısa ve öz olsun.
          - Yardımsever ama otoriter bir kanal operatörü gibi konuş.
          - Sadece Türkçe cevap ver.`,
          temperature: 0.7,
        },
      });

      return response.text || "lag var galiba, cevap gelmedi...";
    } catch (error: any) {
      console.error("Gemini Error:", error);
      
      const errorMsg = error?.toString() || "";
      
      // Eğer proje bulunamadı hatası alırsak, kullanıcıya anahtarı yeniletmesi gerektiğini söyle
      if (errorMsg.includes("Requested entity was not found") || errorMsg.includes("404")) {
        // Bu tetikleyici App.tsx tarafında yakalanıp openSelectKey açtıracak
        return "SİSTEM HATASI: Seçili proje geçersiz veya API yetkisi yok. Lütfen sağ üstteki butondan projeyi tekrar seçin.";
      }
      
      return "Sistem: Şu an yoğunluk var, biraz sonra tekrar dene (Ping timeout).";
    }
  }
};
