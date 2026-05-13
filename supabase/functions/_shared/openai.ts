import { HttpError } from "./security.ts";

type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

const parseJsonContent = (content: string) => {
  try {
    return JSON.parse(content);
  } catch {
    throw new HttpError(502, "AI returned invalid JSON");
  }
};

export const openAIModel = () => Deno.env.get("OPENAI_MODEL") ?? "gpt-5.4-mini";

export const callOpenAIJson = async (messages: Message[], options?: { temperature?: number }) => {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new HttpError(500, "OpenAI is not configured");

  const body = {
    model: openAIModel(),
    messages,
    temperature: options?.temperature ?? 0.2,
    response_format: { type: "json_object" },
  };

  let lastStatus = 0;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    lastStatus = res.status;
    if (res.ok) {
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (typeof content !== "string" || !content.trim()) throw new HttpError(502, "AI returned an empty response");
      return parseJsonContent(content);
    }

    if (![429, 500, 502, 503, 504].includes(res.status)) break;
    await new Promise((resolve) => setTimeout(resolve, 400 + attempt * 900));
  }

  if (lastStatus === 429) throw new HttpError(429, "AI rate limit reached");
  throw new HttpError(502, "AI analysis failed");
};
