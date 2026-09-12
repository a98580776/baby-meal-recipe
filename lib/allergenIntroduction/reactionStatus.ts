import { REACTION_STATUS_VALUES, type ReactionStatus } from "./types";

const REACTION_STATUS_LABELS: Record<ReactionStatus, string> = {
  none: "이상 없음",
  mild: "경미한 반응",
  moderate: "중등도 반응",
  severe: "심각한 반응",
};

export function reactionStatusLabel(status: ReactionStatus): string {
  return REACTION_STATUS_LABELS[status];
}

export function isValidReactionStatus(value: string): value is ReactionStatus {
  return (REACTION_STATUS_VALUES as readonly string[]).includes(value);
}
