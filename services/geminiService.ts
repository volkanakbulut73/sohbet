
import { GoogleGenAI } from "@google/genai";

export const getGeminiResponse = async (prompt: string, context: string, imageBase64?: string) => {
  try {
    // Fix: Create fresh client instance for each request
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = "gemini-3-flash-preview";
    let contents: any;

    if (imageBase64) {
      // Multimodal request (Text + Image)
      contents = {
        parts: [
          { text: `You are an IRC bot. User sent an image. Context: ${context}. Instruction: ${prompt || 'Analyze this image briefly.'}` },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: imageBase64.split(',')[1] // Remove data:image/jpeg;base64, prefix
            }
          }
        ]
      };
    } else {
      contents = `You are a helpful chat bot in an IRC-style channel. 
                 The current channel context is: ${context}. 
                 Keep your response concise and formatted in plain text.
                 User query: ${prompt}`;
    }

    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        temperature: 0.7,
      }
    });
    
    return response.text || "Resmi inceledim ama bir şey söyleyemedim.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Gemini servisi ile iletişimde bir hata oluştu.";
  }
};

export const summarizeChannel = async (messages: string[]) => {
  try {
    // Fix: Create fresh client instance for each request
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Summarize the following chat conversation briefly in 1-2 sentences:
                 ${messages.join('\n')}`,
      config: {
        temperature: 0.3
      }
    });
    return response.text || "Özet bulunamadı.";
  } catch (error) {
    return "Özet oluşturulamadı.";
  }
};
