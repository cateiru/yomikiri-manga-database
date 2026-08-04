type NuxtDataArray = unknown[];

// devalue が Vue のリアクティビティラッパーに使うタグ。`["ShallowReactive", 3]` の
// ように「タグ名 + 実体へのインデックス」という形で、data サブツリーの内部でも
// （ルートだけでなく）入れ子で使われているため、出会うたびにアンラップする
const REACTIVITY_TAGS = new Set(["ShallowReactive", "Reactive", "Ref", "EmptyRef"]);

function resolveIndex(arr: NuxtDataArray, index: number, cache: Map<number, unknown>): unknown {
  if (cache.has(index)) {
    return cache.get(index);
  }

  const raw = arr[index];
  let result: unknown;

  if (raw === null || typeof raw !== "object") {
    result = raw;
  } else if (Array.isArray(raw)) {
    if (typeof raw[0] === "string" && REACTIVITY_TAGS.has(raw[0]) && typeof raw[1] === "number") {
      result = resolveIndex(arr, raw[1], cache);
    } else {
      result = raw.map((value) =>
        typeof value === "number" ? resolveIndex(arr, value, cache) : value,
      );
    }
  } else {
    const obj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
      obj[key] = typeof value === "number" ? resolveIndex(arr, value, cache) : value;
    }
    result = obj;
  }

  cache.set(index, result);
  return result;
}

/**
 * Nuxt の `__NUXT_DATA__` は「フラット配列 + 数値インデックス参照」の devalue 形式で
 * シリアライズされている。ここでは API レスポンスキャッシュ（ルートの `data` フィールド、
 * `{ "/web/episode?...": {...}, ... }` の形）のサブツリーだけを解決して返す。
 * `state`/`pinia` 側は Vue のリアクティビティ用の特殊表現（`["Ref", -4]` のような
 * 負のインデックスを含む）を含み、今回は不要なため踏み込まない
 */
export function extractNuxtApiCache(nuxtDataJson: string): Record<string, unknown> | null {
  let arr: unknown;
  try {
    arr = JSON.parse(nuxtDataJson);
  } catch {
    return null;
  }
  if (!Array.isArray(arr)) {
    return null;
  }

  // arr[0] は ["ShallowReactive", <ルートオブジェクトのインデックス>]
  const root = arr[0];
  if (!Array.isArray(root) || typeof root[1] !== "number") {
    return null;
  }

  // ルートオブジェクトは { data: <インデックス>, state: ..., ... } の形
  const rootObj = arr[root[1]];
  if (typeof rootObj !== "object" || rootObj === null || Array.isArray(rootObj)) {
    return null;
  }

  const dataIndex = (rootObj as Record<string, unknown>).data;
  if (typeof dataIndex !== "number") {
    return null;
  }

  const resolved = resolveIndex(arr, dataIndex, new Map());
  if (typeof resolved !== "object" || resolved === null || Array.isArray(resolved)) {
    return null;
  }

  return resolved as Record<string, unknown>;
}

/**
 * API キャッシュのキーは `/web/episode?version=...&episode_id=123` のようにクエリ文字列
 * 込みで、呼び出し側は正確なクエリを事前に知らないため、パスの前方一致で探す
 */
export function findApiCacheEntry(apiCache: Record<string, unknown>, pathPrefix: string): unknown {
  const key = Object.keys(apiCache).find((k) => k.startsWith(pathPrefix));
  return key !== undefined ? apiCache[key] : undefined;
}
