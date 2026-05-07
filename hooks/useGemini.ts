import { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

export function useGemini() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (prompt: string, history: any[] = []) => {
    setIsLoading(true);
    setError(null);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Gemini API key is not configured.");

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      // Build context from history, ensuring first message is a 'user' message
      let formattedHistory = history.map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      }));

      // Gemini requires the history to start with a 'user' role
      while (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
        formattedHistory.shift();
      }

      const chat = model.startChat({
        history: formattedHistory,
      });

      const result = await chat.sendMessage(prompt);
      const responseText = result.response.text();
      
      setIsLoading(false);
      return responseText;
    } catch (err: any) {
      console.error("Gemini Error:", err);
      setError(err.message || "An error occurred");
      setIsLoading(false);
      return "Sorry, I am having trouble connecting right now.";
    }
  };

  return { sendMessage, isLoading, error };
}
