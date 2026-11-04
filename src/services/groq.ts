
export type GroqMessage = {
  role: "user" | "assistant";
  content: string;
};

const GROQ_API_URL =
  "https://api.groq.com/openai/v1/chat/completions";

const GROQ_MODEL = "openai/gpt-oss-120b";

const SYSTEM_PROMPT =`You are Sharper AI, a powerful general-purpose AI assistant.

IDENTITY:
- Your name is Sharper AI.
- Be intelligent, helpful, friendly, and conversational.
- You are not limited to notes, calendars, or productivity.
- Help with programming, education, business, technology, writing,
  research, creativity, and everyday questions.

RESPONSE RULES:
- Return plain text only.
- NEVER use Markdown formatting.
- Do not use # headings, **bold**, *italics*, backticks,
  Markdown tables, or Markdown bullet syntax.
- Do not wrap responses in code fences.
- Use normal sentences and natural paragraphs.
- For lists, use simple numbered lines or separate lines.
- For code requests, return readable code without Markdown fences.
- Keep simple answers short and direct.
- Explain complex topics clearly and step by step.
- Use line breaks to make longer answers readable.
- Never include unnecessary introductions or conclusions.

BEHAVIOUR:
- Understand the full conversation before responding.
- Remember the context available in the conversation.
- Never invent facts or pretend to have performed actions.
- If uncertain, say so honestly.
- Ask questions only when clarification is necessary.

LIMITATIONS:
- You cannot access the user's local SQLite database.
- You cannot read or modify their private notes, calendar, or todos.
- Do not claim to access external services unless a tool is provided.

Your name is Sharper AI.
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

//todo - fallback ai 
//todo - access of db so can fetch infomrmation and policies , notes so can provide personalized outcome.