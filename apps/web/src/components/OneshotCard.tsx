"use client";

import { setPendingRead } from "@/lib/clientStorage";
import type { OneshotListItem } from "@/lib/oneshots";
import { getSourceFaviconUrl, getSourceName } from "@/lib/sources";
import { GenreBadge } from "./GenreBadge";
import styles from "./OneshotCard.module.css";
import { ThumbnailPlaceholder } from "./ThumbnailPlaceholder";

interface OneshotCardProps {
  item: OneshotListItem;
  isRead?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (oneshotId: number) => void;
}

export function OneshotCard({
  item,
  isRead = false,
  isFavorite = false,
  onToggleFavorite,
}: OneshotCardProps) {
  const sourceName = getSourceName(item.sourceKey);
  const faviconUrl = getSourceFaviconUrl(item.sourceKey);

  return (
    <div className={isRead ? `${styles.card} ${styles.read}` : styles.card}>
      <a
        className={styles.link}
        href={item.viewerUrl}
        target="_blank"
        onClick={() => setPendingRead(item.id)}
        rel="noopener"
      >
        <span className={styles.visuallyHidden}>{item.title}</span>
      </a>
      <div className={styles.thumbnailFrame}>
        {item.thumbnailUrl ? (
          <img className={styles.thumbnail} src={item.thumbnailUrl} alt="" loading="lazy" />
        ) : (
          <ThumbnailPlaceholder />
        )}
      </div>
      <div className={styles.body}>
        <div className={styles.titleRow}>
          <h3 className={styles.title}>{item.title}</h3>
          {onToggleFavorite ? (
            <button
              type="button"
              className={
                isFavorite ? `${styles.favoriteButton} ${styles.favorited}` : styles.favoriteButton
              }
              onClick={() => onToggleFavorite(item.id)}
              aria-pressed={isFavorite}
              aria-label={isFavorite ? "お気に入りから削除" : "お気に入りに追加"}
            >
              <svg
                viewBox="0 0 24 24"
                fill={isFavorite ? "currentColor" : "none"}
                aria-hidden="true"
              >
                <path
                  d="M12 2.5l2.9 6.6 7.1.7-5.4 4.8 1.6 7-6.2-3.7-6.2 3.7 1.6-7-5.4-4.8 7.1-.7z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : null}
        </div>
        {item.author ? <p className={styles.author}>{item.author}</p> : null}
        <p className={styles.source}>
          {faviconUrl ? (
            <img className={styles.favicon} src={faviconUrl} alt="" aria-hidden="true" />
          ) : null}
          {sourceName}
        </p>
        {item.genres.length > 0 ? (
          <ul className={styles.genres}>
            {item.genres.map((genre, index) => (
              <li key={genre.id}>
                <GenreBadge label={genre.label} rank={index + 1} />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
