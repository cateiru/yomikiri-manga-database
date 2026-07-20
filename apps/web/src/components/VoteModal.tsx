"use client";

import { type KeyboardEvent as ReactKeyboardEvent, useEffect, useRef, useState } from "react";
import { getAnonymousUserId } from "@/lib/clientStorage";
import type { Genre } from "@/lib/genres";
import type { OneshotListItem } from "@/lib/oneshots";
import { GenreChip } from "./GenreChip";
import { ThumbnailPlaceholder } from "./ThumbnailPlaceholder";
import styles from "./VoteModal.module.css";

interface VoteModalProps {
  item: OneshotListItem;
  genres: Genre[];
  onSkip: () => void;
  onVoted: () => void;
}

const FOCUSABLE_SELECTOR = 'input, button, [href], [tabindex]:not([tabindex="-1"])';

export function VoteModal({ item, genres, onSkip, onVoted }: VoteModalProps) {
  const [selectedGenreIds, setSelectedGenreIds] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus();
  }, []);

  const trapFocus = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      onSkip();
      return;
    }
    if (event.key !== "Tab" || !dialogRef.current) {
      return;
    }
    const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    if (focusableElements.length === 0) {
      return;
    }
    const first = focusableElements.item(0);
    const last = focusableElements.item(focusableElements.length - 1);
    if (!first || !last) {
      return;
    }
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const toggleGenre = (genreId: number, checked: boolean) => {
    setSelectedGenreIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(genreId);
      } else {
        next.delete(genreId);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(false);
    try {
      const response = await fetch(`/api/oneshots/${item.id}/votes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anonymousUserId: getAnonymousUserId(),
          genreIds: [...selectedGenreIds],
        }),
      });
      if (!response.ok) {
        throw new Error("投票に失敗しました");
      }
      onVoted();
    } catch {
      setError(true);
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="vote-modal-question"
        onKeyDown={trapFocus}
      >
        <div className={styles.target}>
          {item.thumbnailUrl ? (
            <div className={styles.thumbnailWrap}>
              <img className={styles.thumbnail} src={item.thumbnailUrl} alt="" />
            </div>
          ) : (
            <div className={styles.thumbnailWrap}>
              <ThumbnailPlaceholder />
            </div>
          )}
          <p className={styles.targetTitle}>{item.title}</p>
        </div>
        <p id="vote-modal-question" className={styles.question}>
          この読み切りはどんなジャンルでしたか？
        </p>
        <ul className={styles.genres}>
          {genres.map((genre) => (
            <li key={genre.id}>
              <GenreChip
                label={genre.label}
                checked={selectedGenreIds.has(genre.id)}
                onChange={(checked) => toggleGenre(genre.id, checked)}
              />
            </li>
          ))}
        </ul>
        {error ? (
          <p className={styles.error} role="alert">
            投票に失敗しました。もう一度お試しください。
          </p>
        ) : null}
        <div className={styles.footer}>
          <button type="button" className={styles.secondary} onClick={onSkip}>
            スキップ
          </button>
          <button
            type="button"
            className={styles.primary}
            onClick={handleSubmit}
            disabled={selectedGenreIds.size === 0 || submitting}
          >
            投票する
          </button>
        </div>
      </div>
    </div>
  );
}
