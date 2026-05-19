import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

let aiClient: GoogleGenAI | null = null;
function getAI() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY yoxud OPENAI_API_KEY Vercel Environment Variables da kiritilmagan. Iltimos Verceldan sozlamalarga kirib API Key larni qoshing.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API constraints
  app.all("/api/ai*", async (req, res) => {
    if (req.method === 'OPTIONS') {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Content-Length, X-Requested-With, x-openai-key");
      res.sendStatus(200);
      return;
    }
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed' });
      return;
    }
    try {
      const { prompt, model = 'gemini-2.0-flash', config } = req.body;
      let customOpenAiKey = (req.headers['x-openai-key'] as string) || process.env.OPENAI_API_KEY || process.env.OpenAI || process.env.OPENAI_KEY || '';
      
      if (!customOpenAiKey || customOpenAiKey === 'null' || customOpenAiKey === 'undefined') {
        for (const [k, v] of Object.entries(process.env)) {
           const lowerKey = k.toLowerCase();
           if (lowerKey === 'openai_api_key' || lowerKey === 'openai' || lowerKey === 'openai_key') {
               customOpenAiKey = v as string;
               break;
           }
        }
      }

      if (typeof customOpenAiKey === 'string') {
        customOpenAiKey = customOpenAiKey.trim();
      }

      if (customOpenAiKey && typeof customOpenAiKey === 'string' && customOpenAiKey.length > 5) {
        // Use OpenAI
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
          messages: messages as any,
          response_format: config?.responseMimeType === 'application/json' ? { type: "json_object" } : { type: "text" },
        });

        res.json({ text: completion.choices[0]?.message?.content || "" });
        return;
      }

      const response = await getAI().models.generateContent({
        model,
        contents: prompt,
        config
      });
      res.json({ text: response.text });
    } catch (error: any) {
      console.error("AI Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate content" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
