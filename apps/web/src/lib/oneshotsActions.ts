"use server";

import { z } from "zod";
import {
  getOneshotById,
  getOneshotsPage,
  type OneshotListItem,
  type OneshotsCursor,
  type OneshotsPage,
} from "./oneshots";

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
