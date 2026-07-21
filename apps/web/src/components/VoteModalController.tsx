"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addReadOneshotId,
  addSkippedOneshotId,
  addVotedOneshotId,
  clearPendingRead,
  getPendingRead,
  getReadOneshotIds,
  getSkippedOneshotIds,
  getVotedOneshotIds,
} from "@/lib/clientStorage";
import type { Genre } from "@/lib/genres";
import type { OneshotListItem } from "@/lib/oneshots";
import { fetchOneshotByIdAction } from "@/lib/oneshotsActions";
import { evaluatePendingRead } from "@/lib/readDetection";
import { ShareModal } from "./ShareModal";
import { VoteModal } from "./VoteModal";

const SHARE_MILESTONE_READ_COUNTS = [5, 50, 100];

interface VoteModalControllerProps {
  items: OneshotListItem[];
  genres: Genre[];
  onRead?: (oneshotId: number) => void;
}

export function VoteModalController({ items, genres, onRead }: VoteModalControllerProps) {
  const [target, setTarget] = useState<OneshotListItem | null>(null);
  const [shareMilestone, setShareMilestone] = useState<number | null>(null);

  const markRead = useCallback(
    (oneshotId: number) => {
      const isNewRead = !getReadOneshotIds().includes(oneshotId);
      addReadOneshotId(oneshotId);
      onRead?.(oneshotId);

      if (isNewRead) {
        const readCount = getReadOneshotIds().length;
        if (SHARE_MILESTONE_READ_COUNTS.includes(readCount)) {
          setShareMilestone(readCount);
        }
      }
    },
    [onRead],
  );

  const closeVoteModal = useCallback(() => {
    setTarget(null);
  }, []);

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

  if (!target && shareMilestone === null) {
    return null;
  }

  if (target) {
    return (
      <VoteModal
        item={target}
        genres={genres}
        onSkip={() => {
          addSkippedOneshotId(target.id);
          closeVoteModal();
        }}
        onVoted={() => {
          addVotedOneshotId(target.id);
          closeVoteModal();
        }}
      />
    );
  }

  if (shareMilestone !== null) {
    return <ShareModal readCount={shareMilestone} onClose={() => setShareMilestone(null)} />;
  }

  return null;
}
