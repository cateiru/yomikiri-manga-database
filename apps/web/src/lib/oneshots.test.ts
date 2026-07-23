import { describe, expect, it } from "vitest";
import { selectGenreBadges } from "./oneshots";

function badge(id: number, votes: number) {
  return { id, key: `genre-${id}`, label: `ジャンル${id}`, votes };
}

describe("selectGenreBadges", () => {
  it("投票が無ければ空配列を返す", () => {
    expect(selectGenreBadges([])).toEqual([]);
  });

  it("最多得票の50%未満のジャンルは除外する", () => {
    const result = selectGenreBadges([badge(1, 10), badge(2, 4), badge(3, 6)]);

    expect(result.map((genre) => genre.id)).toEqual([1, 3]);
  });

  it("僅差であれば3件を超えても表示する", () => {
    const result = selectGenreBadges([badge(1, 10), badge(2, 9), badge(3, 8), badge(4, 5)]);

    expect(result.map((genre) => genre.id)).toEqual([1, 2, 3, 4]);
  });

  it("得票数が同数の場合はジャンルID昇順で並べる", () => {
    const result = selectGenreBadges([badge(3, 5), badge(1, 5)]);

    expect(result.map((genre) => genre.id)).toEqual([1, 3]);
  });

  it("MAX_GENRE_BADGES を超える場合は上位で打ち切る", () => {
    const result = selectGenreBadges([
      badge(1, 5),
      badge(2, 5),
      badge(3, 5),
      badge(4, 5),
      badge(5, 5),
      badge(6, 5),
      badge(7, 5),
    ]);

    expect(result).toHaveLength(6);
  });

  it("投票が1件のみでも表示する", () => {
    const result = selectGenreBadges([badge(1, 1)]);

    expect(result.map((genre) => genre.id)).toEqual([1]);
  });
});
