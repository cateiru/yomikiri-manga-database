"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import styles from "@/app/page.module.css";
import { getReadOneshotIds } from "@/lib/clientStorage";
import type { Genre } from "@/lib/genres";
import type { OneshotListItem, OneshotsCursor } from "@/lib/oneshots";
import { loadMoreOneshotsAction } from "@/lib/oneshotsActions";
import { EmptyState } from "./EmptyState";
import { OneshotCard } from "./OneshotCard";
import gridStyles from "./OneshotsGrid.module.css";
import { VoteModalController } from "./VoteModalController";

interface OneshotsGridProps {
  genreKeys: string[];
  genres: Genre[];
  initialItems: OneshotListItem[];
  initialCursor: OneshotsCursor | null;
}

export function OneshotsGrid({
  genreKeys,
  genres,
  initialItems,
  initialCursor,
}: OneshotsGridProps) {
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [isPending, startTransition] = useTransition();
  const [loadError, setLoadError] = useState(false);
  const [readIds, setReadIds] = useState<Set<number>>(new Set());
  const loadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setReadIds(new Set(getReadOneshotIds()));
  }, []);

  const markRead = useCallback((oneshotId: number) => {
    setReadIds((prev) => {
      if (prev.has(oneshotId)) {
        return prev;
      }
      return new Set(prev).add(oneshotId);
    });
  }, []);

  const loadMore = useCallback(() => {
    if (!cursor || loadingRef.current) {
      return;
    }
    loadingRef.current = true;
    setLoadError(false);
    startTransition(async () => {
      try {
        const page = await loadMoreOneshotsAction(genreKeys, cursor);
        setItems((prev) => [...prev, ...page.items]);
        setCursor(page.nextCursor);
      } catch {
        setLoadError(true);
      } finally {
        loadingRef.current = false;
      }
    });
  }, [cursor, genreKeys]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !cursor) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [cursor, loadMore]);

  if (items.length === 0) {
    return <EmptyState message="該当する読み切りが見つかりませんでした。" />;
  }

  return (
    <>
      <ul className={styles.grid}>
        {items.map((item) => (
          <li key={item.id}>
            <OneshotCard item={item} isRead={readIds.has(item.id)} />
          </li>
        ))}
      </ul>
      {cursor ? (
        <div ref={sentinelRef} className={gridStyles.sentinel}>
          {isPending ? <p role="status">読み込み中...</p> : null}
          {loadError ? (
            <button type="button" onClick={loadMore}>
              再読み込み
            </button>
          ) : null}
        </div>
      ) : null}
      <VoteModalController items={items} genres={genres} onRead={markRead} />
    </>
  );
}
