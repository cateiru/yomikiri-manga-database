"use server";

import { z } from "zod";
import {
  getOneshotById,
  getOneshotsByIds,
  getOneshotsPage,
  type OneshotListItem,
  type OneshotsCursor,
  type OneshotsPage,
} from "./oneshots";

// あまりに大量の ID が渡された場合でも一覧を空にせず、直近分だけで応答を続ける
const MAX_FETCH_BY_IDS = 500;

const cursorSchema = z.object({
  publishedAt: z.string().nullable(),
  title: z.string(),
  id: z.number().int().positive(),
});

const loadMoreSchema = z.object({
  genreKeys: z.array(z.string()),
  cursor: cursorSchema,
});

export async function loadMoreOneshotsAction(
  genreKeys: string[],
  cursor: OneshotsCursor,
): Promise<OneshotsPage> {
  const parsed = loadMoreSchema.safeParse({ genreKeys, cursor });
  if (!parsed.success) {
    return { items: [], nextCursor: null };
  }
  return getOneshotsPage(parsed.data.genreKeys, parsed.data.cursor);
}

export async function fetchOneshotByIdAction(id: number): Promise<OneshotListItem | null> {
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return getOneshotById(id);
}

const idsSchema = z.array(z.number().int().positive());

export async function fetchOneshotsByIdsAction(ids: number[]): Promise<OneshotListItem[]> {
  const parsed = idsSchema.safeParse(ids);
  if (!parsed.success) {
    return [];
  }
  return getOneshotsByIds(parsed.data.slice(-MAX_FETCH_BY_IDS));
}
