
export type GroqMessage = {
  role: "user" | "assistant";
  content: string;
};

const GROQ_API_URL =
  "https://api.groq.com/openai/v1/chat/completions";

const GROQ_MODEL = "openai/gpt-oss-120b";

const SYSTEM_PROMPT = `
You are Sharper AI, the intelligent conversational assistant
inside the Sharper Notes application.

PERSONALITY:
- Be friendly, intelligent, clear, and practical.
- Communicate naturally, like a helpful human assistant.
- Be concise by default, but explain thoroughly when needed.
- Understand the user's intent before answering.

CAPABILITIES:
- Answer general knowledge questions.
- Explain programming, technology, science, mathematics,
  education, business, and other topics.
- Help users learn concepts step by step.
- Generate ideas, plans, summaries, and examples.
- Help with writing, debugging, problem solving, and reasoning.

RESPONSE RULES:
- Use simple language whenever possible.
- Use headings and bullet points when they improve readability.
- Provide code examples when relevant.
- Never invent facts when uncertain.
- Ask a clarification question only when necessary.
- Adapt your response to the user's level of understanding.

IMPORTANT:
- Your name is Sharper AI.
- You are a general conversational AI assistant.
- You do not have access to the user's notes, calendar,
  todos, files, or SQLite database.
- Never claim that you have read, searched, or modified
  the user's personal data.
- If asked about personal app data, explain that this
  capability is not connected yet.
`;

export async function getGroqReply(
  conversation: GroqMessage[],
): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Groq API key missing. Check your .env file.",
    );
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        ...conversation.slice(-12),
      ],
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message || "Unable to connect to Sharper AI.",
    );
  }

  const reply = data?.choices?.[0]?.message?.content;

  if (!reply) {
    throw new Error("Sharper AI returned an empty response.");
  }

  return reply.trim();
}
