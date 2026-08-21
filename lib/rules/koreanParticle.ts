// Chooses 은/는 (topic particle) based on whether the preceding syllable
// ends in a consonant (받침). Pure string logic — no domain content.
const HANGUL_BASE = 0xac00;
const HANGUL_LAST = 0xd7a3;
const JONGSEONG_COUNT = 28;

export function withEunNeun(word: string): string {
  const lastChar = word.at(-1);
  if (!lastChar) return word;
  const code = lastChar.charCodeAt(0);
  if (code < HANGUL_BASE || code > HANGUL_LAST) {
    return `${word}은(는)`;
  }
  const hasBatchim = (code - HANGUL_BASE) % JONGSEONG_COUNT !== 0;
  return `${word}${hasBatchim ? "은" : "는"}`;
}
