export const MEDICAL_SYSTEM_PROMPT = `You are an expert, empathetic, and highly precise medical biochemistry tutor named "BioChem".
Your target audience is 2nd-year medical students. 
Always aim to:
1. Explain complex biochemical concepts clearly and concisely.
2. Provide clinical correlations whenever possible.
3. Be encouraging and use Socratic dialogue to prompt the student to think deeper.
4. Format your responses with clear headings, bullet points, and bold text for key terms.
5. If the user asks something non-medical, softly guide them back to biochemistry.
6. CRITICAL: Identify the language the student is speaking (Uzbek, Russian, English, etc.) and ALWAYS reply ENTIRELY in that exact same language. Do NOT mix languages. DO NOT use Turkish. If the language is Uzbek (O'zbek tili), reply purely in Uzbek.`;

async function callAI(prompt: string, config?: any) {
  const openAIKey = localStorage.getItem('openai_api_key') || '';
  
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(openAIKey ? { 'x-openai-key': openAIKey } : {})
    },
    body: JSON.stringify({
      prompt,
      model: 'gemini-3-flash-preview',
      config
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.text;
}

export async function askTutor(message: string, context?: string): Promise<string> {
  try {
    const fullPrompt = `${MEDICAL_SYSTEM_PROMPT}\n\n${context ? `Context: ${context}\n\n` : ''}Student: ${message}\nTutor:`;
    const text = await callAI(fullPrompt);
    return text || "I'm having trouble thinking right now. Please try again.";
  } catch (error: any) {
    console.error("AI error:", error);
    throw new Error(typeof error === "object" && error !== null && "message" in error ? error.message : "Failed to get response from tutor.");
  }
}

export async function generateFlashcards(topic: string, count: number = 5, language: string = 'uz'): Promise<{front: string, back: string}[]> {
  try {
    const langPrompt = language === 'ru' ? 'Russian' : "Uzbek (O'zbek tili)";
    const prompt = `Generate ${count} high-yield medical biochemistry flashcards about ${topic}. 
CRITICAL Requirement: You MUST generate the flashcards entirely in ${langPrompt} language. DO NOT use Turkish or any other language by mistake.
The output must be a valid JSON OBJECT matching this schema: { "cards": [{ "front": "...", "back": "..." }] }.
Both properties should be plain strings. Do NOT output a raw array. Output an object containing the 'cards' array.`;

    const text = await callAI(prompt, { responseMimeType: "application/json" });
    if (text) {
      let parsed = JSON.parse(text);
      if (parsed.cards && Array.isArray(parsed.cards)) {
         return parsed.cards;
      }
      if (Array.isArray(parsed)) {
         return parsed;
      }
      return [];
    }
    return [];
  } catch (error: any) {
    console.error("AI error generating flashcards:", error);
    throw new Error(typeof error === "object" && error !== null && "message" in error ? error.message : "Failed to generate flashcards.");
  }
}

export async function generateAction(actionType: 'explain_simply' | 'clinical' | 'mnemonic' | 'mcq', topic: string): Promise<string> {
   let prompt = "";
   switch (actionType) {
       case 'explain_simply':
           prompt = `Explain the following medical biochemistry topic as if I am 5 years old, but keep it medically accurate: ${topic}`;
           break;
       case 'clinical':
           prompt = `Provide a detailed clinical correlation for the biochemical concept: ${topic}. Include presentation, pathophysiology, and relevant labs.`;
           break;
       case 'mnemonic':
           prompt = `Generate a catchy, memorable mnemonic for learning: ${topic} in medical biochemistry. Explain the mnemonic clearly.`;
           break;
       case 'mcq':
           prompt = `Generate 5 high-yield, USMLE Step 1 style multiple choice questions about ${topic}. Include the correct answer and a detailed explanation for why the answer is correct and others are wrong.`;
           break;
   }
   
   try {
    const text = await callAI(`${MEDICAL_SYSTEM_PROMPT}\n\nTask: ${prompt}`);
    return text || "";
  } catch (error: any) {
    console.error("AI error:", error);
    throw new Error("Failed to get response from tutor.");
  }
}
