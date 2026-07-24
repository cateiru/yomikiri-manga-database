"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Genre } from "@/lib/genres";
import { GenreChip } from "./GenreChip";
import styles from "./GenreFilter.module.css";

interface GenreFilterProps {
  genres: Genre[];
}

export function GenreFilter({ genres }: GenreFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedGenres = new Set(searchParams.getAll("genre"));
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }

    const updateFade = () => {
      setCanScrollLeft(el.scrollLeft > 0);
      setCanScrollRight(Math.ceil(el.scrollLeft + el.clientWidth) < el.scrollWidth);
    };

    updateFade();
    el.addEventListener("scroll", updateFade);
    window.addEventListener("resize", updateFade);
    return () => {
      el.removeEventListener("scroll", updateFade);
      window.removeEventListener("resize", updateFade);
    };
  }, []);

  const toggleGenre = (key: string, checked: boolean) => {
    const nextSelected = new Set(selectedGenres);
    if (checked) {
      nextSelected.add(key);
    } else {
      nextSelected.delete(key);
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete("genre");
    for (const genreKey of nextSelected) {
      params.append("genre", genreKey);
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <fieldset className={styles.filter}>
      <legend className={styles.legend}>ジャンルで絞り込む</legend>
      <div className={styles.wrapper}>
        <div className={styles.scroll} ref={scrollRef}>
          {genres.map((genre) => (
            <GenreChip
              key={genre.id}
              label={genre.label}
              checked={selectedGenres.has(genre.key)}
              onChange={(checked) => toggleGenre(genre.key, checked)}
            />
          ))}
        </div>
        <div className={styles.fadeLeft} data-visible={canScrollLeft} aria-hidden="true" />
        <div className={styles.fadeRight} data-visible={canScrollRight} aria-hidden="true" />
      </div>
    </fieldset>
  );
}
