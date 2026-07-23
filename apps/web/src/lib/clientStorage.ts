const ANONYMOUS_USER_ID_KEY = "anonymousUserId";
const PENDING_READ_KEY = "pendingRead";
const VOTED_ONESHOT_IDS_KEY = "votedOneshotIds";
const SKIPPED_ONESHOT_IDS_KEY = "skippedOneshotIds";
const READ_ONESHOT_IDS_KEY = "readOneshotIds";
const FAVORITE_ONESHOT_IDS_KEY = "favoriteOneshotIds";

export interface PendingRead {
  oneshotId: number;
  clickedAt: number;
}

function readJson<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function readIdList(key: string): number[] {
  const value = readJson<unknown>(key);
  if (!Array.isArray(value) || !value.every((id) => typeof id === "number")) {
    return [];
  }
  return value;
}

export function getAnonymousUserId(): string {
  const existing = window.localStorage.getItem(ANONYMOUS_USER_ID_KEY);
  if (existing) {
    return existing;
  }
  const id = crypto.randomUUID();
  window.localStorage.setItem(ANONYMOUS_USER_ID_KEY, id);
  return id;
}

export function getPendingRead(): PendingRead | null {
  const value = readJson<PendingRead>(PENDING_READ_KEY);
  if (!value || typeof value.oneshotId !== "number" || typeof value.clickedAt !== "number") {
    return null;
  }
  return value;
}

export function setPendingRead(oneshotId: number): void {
  const pendingRead: PendingRead = { oneshotId, clickedAt: Date.now() };
  writeJson(PENDING_READ_KEY, pendingRead);
}

export function clearPendingRead(): void {
  window.localStorage.removeItem(PENDING_READ_KEY);
}

export function getVotedOneshotIds(): number[] {
  return readIdList(VOTED_ONESHOT_IDS_KEY);
}

export function addVotedOneshotId(oneshotId: number): void {
  const ids = getVotedOneshotIds();
  if (!ids.includes(oneshotId)) {
    writeJson(VOTED_ONESHOT_IDS_KEY, [...ids, oneshotId]);
  }
}

export function getSkippedOneshotIds(): number[] {
  return readIdList(SKIPPED_ONESHOT_IDS_KEY);
}

export function addSkippedOneshotId(oneshotId: number): void {
  const ids = getSkippedOneshotIds();
  if (!ids.includes(oneshotId)) {
    writeJson(SKIPPED_ONESHOT_IDS_KEY, [...ids, oneshotId]);
  }
}

export function getReadOneshotIds(): number[] {
  return readIdList(READ_ONESHOT_IDS_KEY);
}

export function addReadOneshotId(oneshotId: number): void {
  const ids = getReadOneshotIds();
  if (!ids.includes(oneshotId)) {
    writeJson(READ_ONESHOT_IDS_KEY, [...ids, oneshotId]);
  }
}

/** 追加順（末尾が最新）で並んだお気に入り作品 ID の一覧 */
export function getFavoriteOneshotIds(): number[] {
  return readIdList(FAVORITE_ONESHOT_IDS_KEY);
}

export function addFavoriteOneshotId(oneshotId: number): void {
  const ids = getFavoriteOneshotIds();
  if (!ids.includes(oneshotId)) {
    writeJson(FAVORITE_ONESHOT_IDS_KEY, [...ids, oneshotId]);
  }
}

export function removeFavoriteOneshotId(oneshotId: number): void {
  const ids = getFavoriteOneshotIds();
  writeJson(
    FAVORITE_ONESHOT_IDS_KEY,
    ids.filter((id) => id !== oneshotId),
  );
}

/** デバッグページから localStorage の状態を初期化するために使う */
export function resetAllStoredState(): void {
  for (const key of [
    ANONYMOUS_USER_ID_KEY,
    PENDING_READ_KEY,
    VOTED_ONESHOT_IDS_KEY,
    SKIPPED_ONESHOT_IDS_KEY,
    READ_ONESHOT_IDS_KEY,
    FAVORITE_ONESHOT_IDS_KEY,
  ]) {
    window.localStorage.removeItem(key);
  }
}

export interface TransferPayload {
  anonymousUserId: string;
  votedOneshotIds: number[];
  skippedOneshotIds: number[];
  readOneshotIds: number[];
  favoriteOneshotIds: number[];
}

/** データ引き継ぎ機能でサーバーに預けるためにこの端末の状態を集約する */
export function exportTransferState(): TransferPayload {
  return {
    anonymousUserId: getAnonymousUserId(),
    votedOneshotIds: getVotedOneshotIds(),
    skippedOneshotIds: getSkippedOneshotIds(),
    readOneshotIds: getReadOneshotIds(),
    favoriteOneshotIds: getFavoriteOneshotIds(),
  };
}

function mergeIdLists(current: number[], incoming: number[]): number[] {
  return [...new Set([...current, ...incoming])];
}

/**
 * 引き継いだ状態をこの端末に反映する。
 * overwrite は anonymousUserId ごと置き換えるため、サーバー側の投票履歴（genre_votes）も
 * 引き継がれる。merge は ID 一覧を和集合でマージするのみで anonymousUserId は変えないため、
 * 投票履歴はこの端末のものに留まる。
 */
export function importTransferState(payload: TransferPayload, mode: "overwrite" | "merge"): void {
  if (mode === "overwrite") {
    window.localStorage.setItem(ANONYMOUS_USER_ID_KEY, payload.anonymousUserId);
    writeJson(VOTED_ONESHOT_IDS_KEY, payload.votedOneshotIds);
    writeJson(SKIPPED_ONESHOT_IDS_KEY, payload.skippedOneshotIds);
    writeJson(READ_ONESHOT_IDS_KEY, payload.readOneshotIds);
    writeJson(FAVORITE_ONESHOT_IDS_KEY, payload.favoriteOneshotIds);
    return;
  }

  writeJson(VOTED_ONESHOT_IDS_KEY, mergeIdLists(getVotedOneshotIds(), payload.votedOneshotIds));
  writeJson(
    SKIPPED_ONESHOT_IDS_KEY,
    mergeIdLists(getSkippedOneshotIds(), payload.skippedOneshotIds),
  );
  writeJson(READ_ONESHOT_IDS_KEY, mergeIdLists(getReadOneshotIds(), payload.readOneshotIds));
  writeJson(
    FAVORITE_ONESHOT_IDS_KEY,
    mergeIdLists(getFavoriteOneshotIds(), payload.favoriteOneshotIds),
  );
}
