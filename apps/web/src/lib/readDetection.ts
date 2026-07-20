import type { PendingRead } from "./clientStorage";

const READ_THRESHOLD_MS = 10_000;

export interface EvaluatePendingReadParams {
  pendingRead: PendingRead | null;
  votedOneshotIds: number[];
  skippedOneshotIds: number[];
  now: number;
}

export interface PendingReadResult {
  oneshotId: number;
}

/**
 * 「読む」クリックから復帰までの経過時間・投票済み/スキップ済み状態から
 * ジャンル投票モーダルを表示すべきか判定する純粋関数。
 * 呼び出し側は結果に関わらず pendingRead を破棄する。
 */
export function evaluatePendingRead(params: EvaluatePendingReadParams): PendingReadResult | null {
  const { pendingRead, votedOneshotIds, skippedOneshotIds, now } = params;

  if (!pendingRead) {
    return null;
  }

  const elapsed = now - pendingRead.clickedAt;
  if (elapsed < READ_THRESHOLD_MS) {
    return null;
  }

  if (
    votedOneshotIds.includes(pendingRead.oneshotId) ||
    skippedOneshotIds.includes(pendingRead.oneshotId)
  ) {
    return null;
  }

  return { oneshotId: pendingRead.oneshotId };
}
