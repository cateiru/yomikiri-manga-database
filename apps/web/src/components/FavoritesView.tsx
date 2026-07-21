"use client";

import { useCallback, useEffect, useState } from "react";
import gridStyles from "@/app/page.module.css";
import {
  addFavoriteOneshotId,
  getFavoriteOneshotIds,
  removeFavoriteOneshotId,
} from "@/lib/clientStorage";
import type { OneshotListItem } from "@/lib/oneshots";
import { fetchOneshotsByIdsAction } from "@/lib/oneshotsActions";
import { EmptyState } from "./EmptyState";
import { OneshotCard } from "./OneshotCard";

export function FavoritesView() {
  const [items, setItems] = useState<OneshotListItem[] | null>(null);

  useEffect(() => {
    const ids = getFavoriteOneshotIds();
    if (ids.length === 0) {
      setItems([]);
      return;
    }

    let cancelled = false;
    void fetchOneshotsByIdsAction(ids).then((fetched) => {
      if (cancelled) {
        return;
      }
      // 追加順（末尾が最新）を保った上で、最近お気に入りに登録した作品から表示する
      const order = new Map(ids.map((id, index) => [id, index]));
      const sorted = [...fetched].sort((a, b) => (order.get(b.id) ?? 0) - (order.get(a.id) ?? 0));
      setItems(sorted);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleFavorite = useCallback((oneshotId: number) => {
    setItems((prev) => {
      if (!prev) {
        return prev;
      }
      const isFavorite = prev.some((item) => item.id === oneshotId);
      if (isFavorite) {
        removeFavoriteOneshotId(oneshotId);
        return prev.filter((item) => item.id !== oneshotId);
      }
      addFavoriteOneshotId(oneshotId);
      return prev;
    });
  }, []);

  if (items === null) {
    return <p role="status">読み込み中...</p>;
  }

  if (items.length === 0) {
    return <EmptyState message="お気に入りに登録した作品はまだありません。" />;
  }

  return (
    <ul className={gridStyles.grid}>
      {items.map((item) => (
        <li key={item.id}>
          <OneshotCard item={item} isFavorite onToggleFavorite={toggleFavorite} />
        </li>
      ))}
    </ul>
  );
}
