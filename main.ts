import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// The single word a grandma would text about AI: she treats the
// chatbot like another sweet grandchild who happens to be a robot.
const WORD = "Sweetiebot";

function validate(word: string): void {
  if (typeof word !== "string" || word.length === 0) {
    throw new Error("entry must be a non-empty string");
  }
  if (word.length < 1 || word.length > 30) {
    throw new Error("entry must be 1 to 30 characters");
  }
  if (word.trim().length === 0) {
    throw new Error("entry must not be only whitespace");
  }
  if (/\s/.test(word)) {
    throw new Error("entry must be exactly one word (no whitespace)");
  }
  if (!/^\p{L}+$/u.test(word)) {
    throw new Error("entry must be letters only: one plain word, no punctuation tricks");
  }
  if (/[\u0000-\u001f\u007f]/.test(word)) {
    throw new Error("entry must not contain control characters");
  }
  // Round-trip through UTF-8 to guarantee the bytes are valid UTF-8 text.
  const roundTripped = Buffer.from(word, "utf8").toString("utf8");
  if (roundTripped !== word) {
    throw new Error("entry must be valid UTF-8 text");
  }
}

validate(WORD);

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "entry.txt"), WORD, "utf8");
