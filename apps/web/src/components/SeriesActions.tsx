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
  setPendingRead,
} from "@/lib/clientStorage";
import type { Genre } from "@/lib/genres";
import type { OneshotListItem } from "@/lib/oneshots";
import { evaluatePendingRead } from "@/lib/readDetection";
import styles from "./SeriesActions.module.css";
import { VoteModal } from "./VoteModal";

interface SeriesActionsProps {
  item: OneshotListItem;
  genres: Genre[];
}

export function SeriesActions({ item, genres }: SeriesActionsProps) {
  const [voteModalOpen, setVoteModalOpen] = useState(false);

  // トップページからこの作品以外の pendingRead を持ってこの詳細ページに来たケース
  // （フィード経由での直接遷移等）では他作品の pendingRead を破棄せず残す
  const checkPendingRead = useCallback(() => {
    const pendingRead = getPendingRead();
    if (!pendingRead || pendingRead.oneshotId !== item.id) {
      return;
    }
    clearPendingRead();

    const result = evaluatePendingRead({
      pendingRead,
      votedOneshotIds: getVotedOneshotIds(),
      skippedOneshotIds: getSkippedOneshotIds(),
      now: Date.now(),
    });
    if (result) {
      addReadOneshotId(item.id);
      setVoteModalOpen(true);
    }
  }, [item.id]);

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

  return (
    <>
      <div className={styles.actions}>
        <a
          className={styles.primary}
          href={item.viewerUrl}
          target="_blank"
          rel="noopener"
          data-read-button
          onClick={() => setPendingRead(item.id)}
        >
          読む
        </a>
        <button type="button" className={styles.secondary} onClick={() => setVoteModalOpen(true)}>
          ジャンルを設定する
        </button>
      </div>
      {voteModalOpen ? (
        <VoteModal
          item={item}
          genres={genres}
          onSkip={() => {
            addSkippedOneshotId(item.id);
            setVoteModalOpen(false);
          }}
          onVoted={() => {
            addVotedOneshotId(item.id);
            setVoteModalOpen(false);
          }}
        />
      ) : null}
    </>
  );
}
