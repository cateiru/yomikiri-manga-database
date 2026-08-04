import { describe, expect, it } from "vitest";
import { extractNuxtApiCache, findApiCacheEntry } from "./nuxtData.js";

// 実データでは data フィールドの指す先自体も ["ShallowReactive", N] でラップ
// されている（ルートだけでなく入れ子でも起きる）ため、そのケースを再現する
const SAMPLE_NUXT_DATA = JSON.stringify([
  ["ShallowReactive", 1],
  { data: 2 },
  ["ShallowReactive", 3],
  { "/web/episode?episode_id=1": 4 },
  { episode_name: 5, start_time: 6 },
  "サンプル作品",
  "2024-01-02 00:00:00",
]);

describe("extractNuxtApiCache", () => {
  it("data サブツリーだけを解決してキャッシュオブジェクトを返す", () => {
    const cache = extractNuxtApiCache(SAMPLE_NUXT_DATA);

    expect(cache).toEqual({
      "/web/episode?episode_id=1": {
        episode_name: "サンプル作品",
        start_time: "2024-01-02 00:00:00",
      },
    });
  });

  it("不正な JSON では null を返す", () => {
    expect(extractNuxtApiCache("not json")).toBeNull();
  });

  it("想定した devalue の形でない場合は null を返す", () => {
    expect(extractNuxtApiCache("{}")).toBeNull();
    expect(extractNuxtApiCache("[]")).toBeNull();
  });
});

describe("findApiCacheEntry", () => {
  it("パスの前方一致でエントリを見つける（クエリ文字列は無視する）", () => {
    const cache = { "/web/episode?version=6.0.0&episode_id=1": { foo: "bar" } };
    expect(findApiCacheEntry(cache, "/web/episode")).toEqual({ foo: "bar" });
  });

  it("見つからない場合は undefined を返す", () => {
    expect(findApiCacheEntry({}, "/web/episode")).toBeUndefined();
  });
});
