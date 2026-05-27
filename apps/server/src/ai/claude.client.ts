import Anthropic from "@anthropic-ai/sdk";
import { env } from "../env";

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 2048;

export async function* createStreamingCompletion(
  systemPrompt: string,
  userPrompt: string
): AsyncGenerator<string> {
  const stream = await anthropic.messages.stream({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  for await (const chunk of stream) {
    if (
      chunk.type === "content_block_delta" &&
      chunk.delta.type === "text_delta"
    ) {
      yield chunk.delta.text;
    }
  }
}

export async function createCompletion(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text content in response");
  }

  return textBlock.text;
}