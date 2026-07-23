import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  exportTransferState,
  getFavoriteOneshotIds,
  getReadOneshotIds,
  getSkippedOneshotIds,
  getVotedOneshotIds,
  importTransferState,
  type TransferPayload,
} from "./clientStorage";

function createLocalStorageStub() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  };
}

beforeEach(() => {
  vi.stubGlobal("window", { localStorage: createLocalStorageStub() });
});

const otherDevicePayload: TransferPayload = {
  anonymousUserId: "22222222-2222-2222-2222-222222222222",
  votedOneshotIds: [10, 20],
  skippedOneshotIds: [30],
  readOneshotIds: [40, 50],
  favoriteOneshotIds: [60],
};

describe("exportTransferState / importTransferState", () => {
  it("exportTransferState は現在の localStorage の状態をまとめて返す", () => {
    window.localStorage.setItem("anonymousUserId", "11111111-1111-1111-1111-111111111111");
    window.localStorage.setItem("votedOneshotIds", "[1]");

    const exported = exportTransferState();

    expect(exported.anonymousUserId).toBe("11111111-1111-1111-1111-111111111111");
    expect(exported.votedOneshotIds).toEqual([1]);
    expect(exported.skippedOneshotIds).toEqual([]);
  });

  it("overwrite は anonymousUserId を含めすべてのキーを payload の値で置き換える", () => {
    window.localStorage.setItem("anonymousUserId", "11111111-1111-1111-1111-111111111111");
    window.localStorage.setItem("votedOneshotIds", "[1]");
    window.localStorage.setItem("favoriteOneshotIds", "[99]");

    importTransferState(otherDevicePayload, "overwrite");

    expect(window.localStorage.getItem("anonymousUserId")).toBe(
      "22222222-2222-2222-2222-222222222222",
    );
    expect(getVotedOneshotIds()).toEqual([10, 20]);
    expect(getSkippedOneshotIds()).toEqual([30]);
    expect(getReadOneshotIds()).toEqual([40, 50]);
    expect(getFavoriteOneshotIds()).toEqual([60]);
  });

  it("merge は各 ID 一覧を和集合でマージし、anonymousUserId は現在の端末の値を維持する", () => {
    window.localStorage.setItem("anonymousUserId", "11111111-1111-1111-1111-111111111111");
    window.localStorage.setItem("votedOneshotIds", "[10,99]");
    window.localStorage.setItem("favoriteOneshotIds", "[100]");

    importTransferState(otherDevicePayload, "merge");

    expect(window.localStorage.getItem("anonymousUserId")).toBe(
      "11111111-1111-1111-1111-111111111111",
    );
    expect(getVotedOneshotIds()).toEqual([10, 99, 20]);
    expect(getSkippedOneshotIds()).toEqual([30]);
    expect(getReadOneshotIds()).toEqual([40, 50]);
    expect(getFavoriteOneshotIds()).toEqual([100, 60]);
  });
});
