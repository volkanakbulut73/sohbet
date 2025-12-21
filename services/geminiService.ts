
import { GoogleGenAI, Type } from "@google/genai";

// Fixed: Use process.env.API_KEY directly as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getGeminiResponse = async (prompt: string, context: string) => {
  try {
    // Fixed: contents should be a string or a proper Content object
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a helpful chat bot in an IRC-style channel. 
                 The current channel context is: ${context}. 
                 Keep your response concise, friendly, and formatted in plain text.
                 User query: ${prompt}`,
      config: {
        temperature: 0.7,
      }
    });
    // response.text is a property, not a function
    return response.text || "I'm having trouble connecting to my brain right now.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error communicating with Gemini service.";
  }
};

export const summarizeChannel = async (messages: string[]) => {
  try {
    // Fixed: contents should be a string or a proper Content object
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Summarize the following chat conversation briefly in 1-2 sentences:
                 ${messages.join('\n')}`,
      config: {
        temperature: 0.3
      }
    });
    // response.text is a property, not a function
    return response.text || "No summary available.";
  } catch (error) {
    return "Could not generate summary.";
  }
};