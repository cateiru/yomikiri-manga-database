"use client";

import { setPendingRead } from "@/lib/clientStorage";
import type { OneshotListItem } from "@/lib/oneshots";
import { getSourceFaviconUrl, getSourceName } from "@/lib/sources";
import { GenreBadge } from "./GenreBadge";
import styles from "./OneshotCard.module.css";
import { ThumbnailPlaceholder } from "./ThumbnailPlaceholder";

interface OneshotCardProps {
  item: OneshotListItem;
}

export function OneshotCard({ item }: OneshotCardProps) {
  const sourceName = getSourceName(item.sourceKey);
  const faviconUrl = getSourceFaviconUrl(item.sourceKey);

  return (
    <a
      className={styles.card}
      href={item.viewerUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => setPendingRead(item.id)}
    >
      <div className={styles.thumbnailFrame}>
        {item.thumbnailUrl ? (
          <img className={styles.thumbnail} src={item.thumbnailUrl} alt="" loading="lazy" />
        ) : (
          <ThumbnailPlaceholder />
        )}
      </div>
      <div className={styles.body}>
        <h3 className={styles.title}>{item.title}</h3>
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
    </a>
  );
}
