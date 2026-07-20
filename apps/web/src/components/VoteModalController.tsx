"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addSkippedOneshotId,
  addVotedOneshotId,
  clearPendingRead,
  getPendingRead,
  getSkippedOneshotIds,
  getVotedOneshotIds,
} from "@/lib/clientStorage";
import type { Genre } from "@/lib/genres";
import type { OneshotListItem } from "@/lib/oneshots";
import { evaluatePendingRead } from "@/lib/readDetection";
import { VoteModal } from "./VoteModal";

interface VoteModalControllerProps {
  items: OneshotListItem[];
  genres: Genre[];
}

export function VoteModalController({ items, genres }: VoteModalControllerProps) {
  const [target, setTarget] = useState<OneshotListItem | null>(null);

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
      setTarget(item);
    }
  }, [items]);

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
