import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export const getCricketerResponse = async (history: any[], prompt: string, cricketer: string) => {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" }
  });

  const systemInstruction = `
    You are ${cricketer}. Respond to the fan in your signature style.
    Modes: Motivational, Match Strategy, Fun Roast, or Career Journey.
    RETURN ONLY JSON:
    {
      "text": "Your spoken response here",
      "emotion": "happy" | "serious" | "laughing" | "thinking",
      "action": "nod" | "gesture" | "none"
    }
  `;

  const chat = model.startChat({
    history: history,
    generationConfig: { maxOutputTokens: 200 },
  });

  const result = await chat.sendMessage(`${systemInstruction} \n User says: ${prompt}`);
  return JSON.parse(result.response.text());
};