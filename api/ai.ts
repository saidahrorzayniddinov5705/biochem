import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { prompt, model = 'gemini-2.0-flash', config } = req.body;
    let customOpenAiKey = (req.headers['x-openai-key']) || process.env.OPENAI_API_KEY || process.env.OpenAI || process.env.OPENAI_KEY || '';
    
    if (!customOpenAiKey || customOpenAiKey === 'null' || customOpenAiKey === 'undefined') {
      for (const [k, v] of Object.entries(process.env)) {
         const lowerKey = k.toLowerCase();
         if (lowerKey === 'openai_api_key' || lowerKey === 'openai' || lowerKey === 'openai_key') {
             customOpenAiKey = v;
             break;
         }
      }
    }

    if (typeof customOpenAiKey === 'string') {
      customOpenAiKey = customOpenAiKey.trim();
    }

    if (customOpenAiKey && typeof customOpenAiKey === 'string' && customOpenAiKey.length > 5) {
      const openai = new OpenAI({ apiKey: customOpenAiKey });
      
      let messages = [];
      if (config?.responseMimeType === 'application/json') {
         messages = [
            { role: 'system', content: 'You must output raw JSON. Do not use markdown blocks like ```json.' },
            { role: 'user', content: prompt }
         ];
      } else {
         messages = [
            { role: 'user', content: prompt }
         ];
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messages,
        response_format: config?.responseMimeType === 'application/json' ? { type: "json_object" } : { type: "text" },
      });

      res.status(200).json({ text: completion.choices[0]?.message?.content || "" });
      return;
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config
    });
    res.status(200).json({ text: response.text });
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate content" });
  }
}
