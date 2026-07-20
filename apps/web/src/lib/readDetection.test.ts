import { describe, expect, it } from "vitest";
import { evaluatePendingRead } from "./readDetection";

const NOW = 1_700_000_000_000;

describe("evaluatePendingRead", () => {
  it("pendingRead が無ければ null を返す", () => {
    const result = evaluatePendingRead({
      pendingRead: null,
      votedOneshotIds: [],
      skippedOneshotIds: [],
      now: NOW,
    });

    expect(result).toBeNull();
  });

  it("経過時間が 10 秒未満なら null を返す", () => {
    const result = evaluatePendingRead({
      pendingRead: { oneshotId: 1, clickedAt: NOW - 9_999 },
      votedOneshotIds: [],
      skippedOneshotIds: [],
      now: NOW,
    });

    expect(result).toBeNull();
  });

  it("経過時間がちょうど 10 秒なら表示対象を返す", () => {
    const result = evaluatePendingRead({
      pendingRead: { oneshotId: 1, clickedAt: NOW - 10_000 },
      votedOneshotIds: [],
      skippedOneshotIds: [],
      now: NOW,
    });

    expect(result).toEqual({ oneshotId: 1 });
  });

  it("経過時間が 10 秒を超えていれば表示対象を返す", () => {
    const result = evaluatePendingRead({
      pendingRead: { oneshotId: 1, clickedAt: NOW - 120_000 },
      votedOneshotIds: [],
      skippedOneshotIds: [],
      now: NOW,
    });

    expect(result).toEqual({ oneshotId: 1 });
  });

  it("投票済みの作品では null を返す", () => {
    const result = evaluatePendingRead({
      pendingRead: { oneshotId: 1, clickedAt: NOW - 10_000 },
      votedOneshotIds: [1],
      skippedOneshotIds: [],
      now: NOW,
    });

    expect(result).toBeNull();
  });

  it("スキップ済みの作品では null を返す", () => {
    const result = evaluatePendingRead({
      pendingRead: { oneshotId: 1, clickedAt: NOW - 10_000 },
      votedOneshotIds: [],
      skippedOneshotIds: [1],
      now: NOW,
    });

    expect(result).toBeNull();
  });

  it("投票済み・スキップ済み以外の作品 ID には反応しない", () => {
    const result = evaluatePendingRead({
      pendingRead: { oneshotId: 2, clickedAt: NOW - 10_000 },
      votedOneshotIds: [1],
      skippedOneshotIds: [1],
      now: NOW,
    });

    expect(result).toEqual({ oneshotId: 2 });
  });
});
