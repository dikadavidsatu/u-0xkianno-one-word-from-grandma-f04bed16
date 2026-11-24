// One Word From Grandma — make.fun bounty
// u-0xkianno-one-word-from-grandma-f04bed16
//
// The whole entry is a single word: the word a grandma would text about AI.
// This program validates that word against the competition gate and writes
// exactly that word — nothing else, no newline, no punctuation — to
// entry.txt inside the output directory, where the sealed scorer reads it.
//
// Why this word? A grandma does not text about AI the way a tech blog does.
// She texts the way she texts her grandchildren: with a pet name. She calls
// the chatbot "sweetie" because, to her, it is just another sweet little
// thing that answers when she talks to it — she only tacks "bot" on the end
// because this particular grandchild happens to be a machine. Warm, a little
// baffled, funny in one word, and unmistakably about a robot: that is the
// whole joke, and it lands without a caption.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// The entry itself
// ---------------------------------------------------------------------------

// The single word grandma would text about AI.
const WORD = "Sweetiebot";

// ---------------------------------------------------------------------------
// The gate (from the competition rules, sealed scorer checks entry.txt):
//   - UTF-8 text
//   - 1 to 30 characters
//   - not only white space
// The brief adds: one word, no sentence, no explanation, no punctuation
// tricks. This program enforces all of it before writing anything, so a bad
// word fails loudly here instead of silently scoring 0 on the judge's board.
// ---------------------------------------------------------------------------

const GATE_MIN_CHARS = 1;
const GATE_MAX_CHARS = 30;
const OUTPUT_FILENAME = "entry.txt";
const DEFAULT_OUTPUT_DIR = "/output";

// Count characters the way a reader counts them: one code point per
// character, so an astral-plane letter is one character, not two UTF-16
// code units. "Sweetiebot" is 10 by any measure, but the helper keeps the
// gate honest for any future word.
function countChars(text: string): number {
  return [...text].length;
}

// A word is one word only when it holds no white space at all — no spaces,
// no tabs, no newlines sneaking in at either end. trim() alone would hide a
// leading space; the test below refuses any white space anywhere.
function hasNoWhitespace(text: string): boolean {
  return !/\s/.test(text);
}

// Letters only, in any alphabet: a real word, not a code, a number, or a
// punctuation trick. \p{L} is the Unicode letter class, so "Sweetiebot"
// passes and "Sweetie-bot", "Sweetie2" or "Sweetie!" do not.
function isLettersOnly(text: string): boolean {
  return /^\p{L}+$/u.test(text);
}

// Control characters (U+0000–U+001F, U+007F) are invisible bytes that would
// make the file look clean while failing the scorer's UTF-8 text check.
function hasNoControlChars(text: string): boolean {
  // eslint-disable-next-line no-control-regex
  return !/[\u0000-\u001f\u007f]/.test(text);
}

// A string that survives a round trip through UTF-8 unchanged is valid
// UTF-8 text. Anything with a lone surrogate or a broken sequence comes
// back different and is caught here.
function roundTripsThroughUtf8(text: string): boolean {
  return Buffer.from(text, "utf8").toString("utf8") === text;
}

// Run every gate rule and collect each failure as a human-readable message,
// so a failure names the rule it broke instead of just saying "invalid".
function gateViolations(word: unknown): string[] {
  const problems: string[] = [];

  if (typeof word !== "string") {
    problems.push(`entry must be a string, got ${typeof word}`);
    return problems;
  }
  if (countChars(word) < GATE_MIN_CHARS || countChars(word) > GATE_MAX_CHARS) {
    problems.push(
      `entry must be ${GATE_MIN_CHARS} to ${GATE_MAX_CHARS} characters, got ${countChars(word)}`,
    );
  }
  if (word.trim().length === 0) {
    problems.push("entry must not be only white space");
  }
  if (!hasNoWhitespace(word)) {
    problems.push("entry must be exactly one word (no white space anywhere)");
  }
  if (!isLettersOnly(word)) {
    problems.push("entry must be letters only: one plain word, no punctuation tricks");
  }
  if (!hasNoControlChars(word)) {
    problems.push("entry must not contain control characters");
  }
  if (!roundTripsThroughUtf8(word)) {
    problems.push("entry must be valid UTF-8 text");
  }
  return problems;
}

// Throw a single error listing every broken rule; a valid word returns it
// unchanged so the rest of the program can trust it completely.
function validateWord(word: unknown): string {
  const problems = gateViolations(word);
  if (problems.length > 0) {
    throw new Error(`entry failed the gate: ${problems.join("; ")}`);
  }
  return word as string;
}

// A one-line-per-rule report of the gate, for the run log: each rule names
// itself and says pass or fail, so anyone reading the output can see exactly
// which checks the word cleared instead of taking a silent exit 0 on trust.
function gateReport(word: string): string[] {
  const checks: Array<[string, boolean]> = [
    [`length ${countChars(word)} chars (gate ${GATE_MIN_CHARS}-${GATE_MAX_CHARS})`, countChars(word) >= GATE_MIN_CHARS && countChars(word) <= GATE_MAX_CHARS],
    ["not only white space", word.trim().length > 0],
    ["exactly one word, no white space", hasNoWhitespace(word)],
    ["letters only, no punctuation tricks", isLettersOnly(word)],
    ["no control characters", hasNoControlChars(word)],
    ["valid UTF-8 round trip", roundTripsThroughUtf8(word)],
  ];
  return checks.map(([label, ok]) => `  [${ok ? "pass" : "FAIL"}] ${label}`);
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

// The grader runs the program with MAKEFUN_OUTPUT_DIR set; locally the
// default is /output, matching the sandbox. An empty value is treated as
// unset rather than as a relative path into nowhere.
function resolveOutputDir(): string {
  const fromEnv = process.env.MAKEFUN_OUTPUT_DIR;
  if (fromEnv !== undefined && fromEnv.trim().length > 0) {
    return fromEnv;
  }
  return DEFAULT_OUTPUT_DIR;
}

// Write exactly the word — no trailing newline, no extra bytes — then read
// the file back and confirm the bytes on disk are byte-for-byte the word we
// validated. If the read-back differs, the entry is wrong and we say so
// instead of exiting 0 on a broken artifact.
function writeEntry(word: string, outDir: string): string {
  mkdirSync(outDir, { recursive: true });
  const target = join(outDir, OUTPUT_FILENAME);
  writeFileSync(target, word, "utf8");
  const written = readFileSync(target, "utf8");
  if (written !== word) {
    throw new Error(
      `wrote ${JSON.stringify(written)} to ${target}, expected ${JSON.stringify(word)}`,
    );
  }
  return target;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const word = validateWord(WORD);
  console.log(`gate report for ${JSON.stringify(word)}:`);
  for (const line of gateReport(word)) {
    console.log(line);
  }
  const outDir = resolveOutputDir();
  const target = writeEntry(word, outDir);
  console.log(
    `wrote one word (${countChars(word)} chars) to ${target}: ${JSON.stringify(word)}`,
  );
}

main();
