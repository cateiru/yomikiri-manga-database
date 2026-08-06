"use client";

import { setPendingRead } from "@/lib/clientStorage";
import type { OneshotListItem } from "@/lib/oneshots";
import styles from "./SeriesThumbnailLink.module.css";
import { ThumbnailPlaceholder } from "./ThumbnailPlaceholder";

interface SeriesThumbnailLinkProps {
  item: OneshotListItem;
}

export function SeriesThumbnailLink({ item }: SeriesThumbnailLinkProps) {
  return (
    <a
      className={styles.link}
      href={item.viewerUrl}
      target="_blank"
      rel="noopener"
      data-thumbnail-link
      onClick={() => setPendingRead(item.id)}
    >
      {item.thumbnailUrl ? (
        <img className={styles.thumbnail} src={item.thumbnailUrl} alt="" />
      ) : (
        <ThumbnailPlaceholder />
      )}
    </a>
  );
}
