export interface TextChunk {
  index: number;
  content: string;
  wordCount: number;
}

const TARGET_WORDS = 500;
const MIN_WORDS = 200;
const MAX_WORDS = 700;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function splitIntoParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.replace(/\n/g, " ").trim())
    .filter((p) => p.length > 0);
}

function isHeading(paragraph: string): boolean {
  // Detect headings: short lines, all caps, numbered sections, or markdown-style
  const trimmed = paragraph.trim();
  if (trimmed.startsWith("#")) return true;
  if (trimmed.length < 80 && trimmed === trimmed.toUpperCase()) return true;
  if (/^(\d+\.|\d+\))\s+[A-Z]/.test(trimmed)) return true;
  if (/^(Chapter|Section|Part|Unit)\s+\d+/i.test(trimmed)) return true;
  return false;
}

export function chunkText(rawText: string): TextChunk[] {
  const paragraphs = splitIntoParagraphs(rawText);
  const chunks: TextChunk[] = [];
  let currentChunk: string[] = [];
  let currentWordCount = 0;
  let chunkIndex = 0;

  const flushChunk = () => {
    if (currentChunk.length === 0) return;
    const content = currentChunk.join("\n\n").trim();
    const wordCount = countWords(content);
    if (wordCount >= MIN_WORDS) {
      chunks.push({ index: chunkIndex++, content, wordCount });
      currentChunk = [];
      currentWordCount = 0;
    }
  };

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i];
    const paraWords = countWords(para);

    // If we hit a heading and have enough content, start a new chunk
    if (isHeading(para) && currentWordCount >= MIN_WORDS) {
      flushChunk();
    }

    currentChunk.push(para);
    currentWordCount += paraWords;

    // If we've hit the target and the next paragraph is a heading, flush here
    const nextIsHeading = i + 1 < paragraphs.length && isHeading(paragraphs[i + 1]);
    if (currentWordCount >= TARGET_WORDS && (nextIsHeading || currentWordCount >= MAX_WORDS)) {
      flushChunk();
    }
  }

  // Flush any remaining content
  if (currentChunk.length > 0) {
    const content = currentChunk.join("\n\n").trim();
    const wordCount = countWords(content);
    if (wordCount > 0) {
      // If remaining is too small, merge with last chunk
      if (wordCount < MIN_WORDS && chunks.length > 0) {
        const last = chunks[chunks.length - 1];
        chunks[chunks.length - 1] = {
          ...last,
          content: last.content + "\n\n" + content,
          wordCount: last.wordCount + wordCount
        };
      } else {
        chunks.push({ index: chunkIndex++, content, wordCount });
      }
    }
  }

  return chunks;
}
