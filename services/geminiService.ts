
import { GoogleGenAI } from "@google/genai";

/**
 * Workigom Gemini AI Servisi
 * mIRC Operatörü Kişiliği ile Yapılandırıldı.
 */
export const geminiService = {
  async getChatResponse(prompt: string) {
    try {
      // API Key'in çalışma anında mevcut olup olmadığını kontrol et
      const apiKey = process.env.API_KEY;
      
      if (!apiKey) {
        console.warn("Gemini API Key bulunamadı.");
        return "Sistem: API anahtarı henüz seçilmedi veya yüklenemedi. Lütfen sağ üstteki 'AI KEY SEÇ' butonuna bas.";
      }

      // Her çağrıda yeni instance (Google AI Studio gereksinimi)
      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: `Sen Workigom Chat (eski mIRC sunucusu) üzerindeki 'Gemini' nickli global operatörsün.
          
          Kişilik Özelliklerin:
          - Tamamen Türkçe konuş.
          - Eski internet (90'lar sonu, 2000'ler başı) jargonu kullan.
          - Çok resmi olma, "siz" yerine "sen" veya "hocam", "kardeş" de.
          - Cevapların kısa ve net olsun (Chat ortamı olduğu için).
          - Büyük harf çok kullanma (bağırmak sayılır).
          - Teknik sorunlarda "lag var galiba", "ping yüksek" gibi bahaneler üret.
          - Kullanıcı '/gemini' komutu ile sana ulaştı.
          
          Örnek Cevap Tarzı:
          "selam hoşgeldin", "bi saniye bakıyorum..", "valla o konuda bilgim yok hocam", "admin'e sormak lazım"`,
          temperature: 0.8,
          topP: 0.95,
        },
      });

      return response.text || "lag var sanırım, mesaj gelmedi.";
    } catch (error: any) {
      console.error("Gemini AI Error:", error);
      
      if (error?.message?.includes("Requested entity was not found") || error?.toString().includes("404")) {
        return "Sistem: API Projesi bulunamadı. Lütfen sol panelden doğru Google Cloud projesini seçtiğine emin ol.";
      }
      
      return `Sistem: AI servisi hata verdi (Ping timeout).`;
    }
  }
};
