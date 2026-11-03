import type { ChapterBlockType } from "../repositories/chapter-notes.repository";

export type ParsedChapterBlock = {
  block_type: ChapterBlockType;
  content: string;
  position: number;
};

const SHORTCUTS: Record<string, ChapterBlockType> = {
  ".h": "heading",
  ".p": "paragraph",
  ".b": "bullet",
  ".n": "numbered",
};

export function parseChapterContent(input: string): ParsedChapterBlock[] {
  const lines = input.split(/\r?\n/);
  const blocks: ParsedChapterBlock[] = [];

  let activeType: ChapterBlockType | null = null;
  let activeContent: string[] = [];

  const saveBlock = () => {
    const content = activeContent.join("\n").trim();

    if (activeType && content) {
      blocks.push({
        block_type: activeType,
        content,
        position: blocks.length,
      });
    }

    activeType = null;
    activeContent = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      if (activeType === "paragraph") {
        activeContent.push("");
      } else {
        saveBlock();
      }
      continue;
    }

    const match = line.match(/^(\.[a-z])(?:\s+)?(.*)$/i);

    if (match) {
      const shortcut = match[1].toLowerCase();
      const nextType = SHORTCUTS[shortcut];

      if (!nextType) {
        throw new Error(`Unknown shortcut: ${shortcut}`);
      }

      saveBlock();
      activeType = nextType;

      if (match[2].trim()) {
        activeContent.push(match[2].trim());
      }

      continue;
    }

    // Text without a shortcut continues the current block.
    // If no block is active, treat it as a paragraph.
    if (!activeType) {
      activeType = "paragraph";
    }

    activeContent.push(line);
  }

  saveBlock();

  return blocks;
}