import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

export interface DigestResult {
  subject: string;
  summary: string;
  keyPoints: string[];
  recallQuestions: string[];
  estimatedReadMinutes: number;
}

export async function generateDigest(
  instanceName: string,
  chunkContent: string,
  chunkIndex: number,
  totalChunks: number
): Promise<DigestResult> {
  const progressPercent = Math.round(((chunkIndex + 1) / totalChunks) * 100);

  const prompt = `You are a study digest assistant. Your job is to summarise a section of notes into a clear, engaging daily digest email that takes 3-7 minutes to read.

The notes are from: "${instanceName}"
Progress: Section ${chunkIndex + 1} of ${totalChunks} (${progressPercent}% through the material)

Here are the notes to summarise:
---
${chunkContent}
---

Return a JSON object with exactly this structure:
{
  "subject": "A compelling email subject line (max 60 chars, include the topic)",
  "summary": "A clear 200-300 word narrative summary of the key ideas in this section. Write as if explaining to a smart friend — conversational but accurate.",
  "keyPoints": ["5-7 bullet points, each a single crisp sentence capturing a key concept"],
  "recallQuestions": ["3 questions the reader should be able to answer after reading this — helps cement the material"],
  "estimatedReadMinutes": 5
}

Return only valid JSON. No markdown, no preamble.`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }]
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const result = JSON.parse(text);
    return result as DigestResult;
  } catch {
    // Fallback if JSON parsing fails
    return {
      subject: `${instanceName} — Section ${chunkIndex + 1} of ${totalChunks}`,
      summary: text,
      keyPoints: [],
      recallQuestions: [],
      estimatedReadMinutes: 5
    };
  }
}
