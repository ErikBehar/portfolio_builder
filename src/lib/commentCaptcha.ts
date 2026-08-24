import { randomInt, randomUUID } from "node:crypto";
import { ApiError } from "@/lib/apiErrors";

export const COMMENT_CAPTCHA_TTL_MS = 10 * 60 * 1000;
const MAX_CHALLENGES = 5_000;

const NUMBER_WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
] as const;

const WORD_TO_NUMBER = new Map<string, number>([
  ...NUMBER_WORDS.map((word, value): [string, number] => [word, value]),
  ["thirteen", 13],
  ["fourteen", 14],
  ["fifteen", 15],
  ["sixteen", 16],
  ["seventeen", 17],
  ["eighteen", 18],
  ["nineteen", 19],
  ["twenty", 20],
  ["twenty-one", 21],
  ["twenty one", 21],
  ["twenty-two", 22],
  ["twenty two", 22],
  ["twenty-three", 23],
  ["twenty three", 23],
  ["twenty-four", 24],
  ["twenty four", 24],
]);

type Challenge = {
  answer: number;
  expiresAt: number;
};

const challenges = new Map<string, Challenge>();

function pruneExpired(now: number) {
  for (const [id, challenge] of challenges) {
    if (now >= challenge.expiresAt) {
      challenges.delete(id);
    }
  }

  if (challenges.size < MAX_CHALLENGES) return;

  const dropCount = Math.floor(challenges.size / 2);
  let dropped = 0;
  for (const id of challenges.keys()) {
    challenges.delete(id);
    dropped += 1;
    if (dropped >= dropCount) break;
  }
}

function parseCaptchaAnswer(value: string): number | null {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;

  const fromWord = WORD_TO_NUMBER.get(trimmed);
  if (fromWord !== undefined) return fromWord;

  if (!/^\d+$/.test(trimmed)) return null;

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isInteger(parsed) ? parsed : null;
}

export type CommentCaptchaChallenge = {
  token: string;
  question: string;
  expiresAt: number;
};

export function createCommentCaptcha(): CommentCaptchaChallenge {
  const now = Date.now();
  pruneExpired(now);

  const left = randomInt(1, 13);
  const right = randomInt(1, 13);
  const usePlus = randomInt(0, 2) === 0;
  const minuend = Math.max(left, right);
  const subtrahend = Math.min(left, right);
  const answer = usePlus ? left + right : minuend - subtrahend;
  const question = usePlus
    ? `What is ${NUMBER_WORDS[left]} plus ${NUMBER_WORDS[right]}?`
    : `What is ${NUMBER_WORDS[minuend]} minus ${NUMBER_WORDS[subtrahend]}?`;

  const token = randomUUID();
  const expiresAt = now + COMMENT_CAPTCHA_TTL_MS;
  challenges.set(token, {
    answer,
    expiresAt,
  });

  return { token, question, expiresAt };
}

function failCommentCaptcha(message: string): never {
  throw new ApiError(message, 400, { captcha: createCommentCaptcha() });
}

export function verifyCommentCaptcha(
  token: unknown,
  answer: unknown
) {
  if (typeof token !== "string" || !token.trim()) {
    failCommentCaptcha("Please complete the verification question");
  }
  if (typeof answer !== "string" && typeof answer !== "number") {
    failCommentCaptcha("Please complete the verification question");
  }

  const now = Date.now();
  pruneExpired(now);

  const challenge = challenges.get(token);
  challenges.delete(token);

  if (!challenge || now >= challenge.expiresAt) {
    failCommentCaptcha("Verification expired. Please try a new question.");
  }

  const parsed =
    typeof answer === "number"
      ? Number.isInteger(answer)
        ? answer
        : null
      : parseCaptchaAnswer(answer);

  if (parsed === null || parsed !== challenge.answer) {
    failCommentCaptcha("Verification answer is incorrect");
  }
}
