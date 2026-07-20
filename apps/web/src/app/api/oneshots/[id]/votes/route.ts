import { genres, genreVotes, oneshots } from "@yomikiri/db/schema";
import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";

const RATE_LIMIT_INTERVAL_MS = 2_000;
const lastRequestAtByIp = new Map<string, number>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const lastRequestAt = lastRequestAtByIp.get(ip);
  lastRequestAtByIp.set(ip, now);
  return lastRequestAt !== undefined && now - lastRequestAt < RATE_LIMIT_INTERVAL_MS;
}

const voteRequestSchema = z.object({
  anonymousUserId: z.string().uuid(),
  genreIds: z.array(z.number().int().positive()).min(1),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const oneshotId = Number(id);
  if (!Number.isInteger(oneshotId)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "too many requests" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = voteRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const db = getDb();

  const oneshotRows = await db
    .select({ id: oneshots.id })
    .from(oneshots)
    .where(eq(oneshots.id, oneshotId))
    .limit(1);
  if (oneshotRows.length === 0) {
    return NextResponse.json({ error: "oneshot not found" }, { status: 404 });
  }

  const { anonymousUserId, genreIds } = parsed.data;
  const uniqueGenreIds = [...new Set(genreIds)];

  const validGenreRows = await db
    .select({ id: genres.id })
    .from(genres)
    .where(inArray(genres.id, uniqueGenreIds));
  if (validGenreRows.length !== uniqueGenreIds.length) {
    return NextResponse.json({ error: "invalid genre id" }, { status: 400 });
  }

  await db
    .insert(genreVotes)
    .values(
      uniqueGenreIds.map((genreId) => ({
        oneshotId,
        genreId,
        anonymousUserId,
      })),
    )
    .onConflictDoNothing();

  return NextResponse.json({ ok: true }, { status: 201 });
}
