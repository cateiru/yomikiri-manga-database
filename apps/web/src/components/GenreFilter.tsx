"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
      {genres.map((genre) => (
        <GenreChip
          key={genre.id}
          label={genre.label}
          checked={selectedGenres.has(genre.key)}
          onChange={(checked) => toggleGenre(genre.key, checked)}
        />
      ))}
    </fieldset>
  );
}
