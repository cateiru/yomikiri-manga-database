"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addReadOneshotId,
  addSkippedOneshotId,
  addVotedOneshotId,
  clearPendingRead,
  getPendingRead,
  getSkippedOneshotIds,
  getVotedOneshotIds,
} from "@/lib/clientStorage";
import type { Genre } from "@/lib/genres";
import type { OneshotListItem } from "@/lib/oneshots";
import { fetchOneshotByIdAction } from "@/lib/oneshotsActions";
import { evaluatePendingRead } from "@/lib/readDetection";
import { VoteModal } from "./VoteModal";

interface VoteModalControllerProps {
  items: OneshotListItem[];
  genres: Genre[];
  onRead?: (oneshotId: number) => void;
}

export function VoteModalController({ items, genres, onRead }: VoteModalControllerProps) {
  const [target, setTarget] = useState<OneshotListItem | null>(null);

  const markRead = useCallback(
    (oneshotId: number) => {
      addReadOneshotId(oneshotId);
      onRead?.(oneshotId);
    },
    [onRead],
  );

  const checkPendingRead = useCallback(() => {
    const result = evaluatePendingRead({
      pendingRead: getPendingRead(),
      votedOneshotIds: getVotedOneshotIds(),
      skippedOneshotIds: getSkippedOneshotIds(),
      now: Date.now(),
    });
    clearPendingRead();

    if (!result) {
      return;
    }

    const item = items.find((candidate) => candidate.id === result.oneshotId);
    if (item) {
      markRead(result.oneshotId);
      setTarget(item);
      return;
    }

    // 無限スクロールでまだ読み込まれていないページに該当作品がある場合
    // (例: バックグラウンドタブ復帰時の再読み込みでitemsが初期ページのみのケース)
    // の安全網として単体取得する
    void fetchOneshotByIdAction(result.oneshotId).then((fallback) => {
      if (fallback) {
        markRead(result.oneshotId);
        setTarget(fallback);
      }
    });
  }, [items, markRead]);

  useEffect(() => {
    checkPendingRead();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkPendingRead();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [checkPendingRead]);

  if (!target) {
    return null;
  }

  return (
    <VoteModal
      item={target}
      genres={genres}
      onSkip={() => {
        addSkippedOneshotId(target.id);
        setTarget(null);
      }}
      onVoted={() => {
        addVotedOneshotId(target.id);
        setTarget(null);
      }}
    />
  );
}
