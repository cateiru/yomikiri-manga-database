import { transferCodes } from "@yomikiri/db/schema";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { generateTransferCode } from "@/lib/transferCode";

const RATE_LIMIT_INTERVAL_MS = 2_000;
const lastRequestAtByIp = new Map<string, number>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const lastRequestAt = lastRequestAtByIp.get(ip);
  lastRequestAtByIp.set(ip, now);
  return lastRequestAt !== undefined && now - lastRequestAt < RATE_LIMIT_INTERVAL_MS;
}

const MAX_ID_LIST_LENGTH = 2_000;

const payloadSchema = z
  .object({
    anonymousUserId: z.string().uuid(),
    votedOneshotIds: z.array(z.number().int().positive()).max(MAX_ID_LIST_LENGTH),
    skippedOneshotIds: z.array(z.number().int().positive()).max(MAX_ID_LIST_LENGTH),
    readOneshotIds: z.array(z.number().int().positive()).max(MAX_ID_LIST_LENGTH),
    favoriteOneshotIds: z.array(z.number().int().positive()).max(MAX_ID_LIST_LENGTH),
  })
  .strict();

const EXPIRES_IN_MS = 24 * 60 * 60 * 1000;
const MAX_GENERATE_ATTEMPTS = 5;

export async function POST(request: Request) {
  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "too many requests" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const db = await getDb();
  const expiresAt = new Date(Date.now() + EXPIRES_IN_MS);

  for (let attempt = 0; attempt < MAX_GENERATE_ATTEMPTS; attempt++) {
    const code = generateTransferCode();
    try {
      await db.insert(transferCodes).values({
        code,
        payload: parsed.data,
        expiresAt,
      });
      return NextResponse.json({ code, expiresAt }, { status: 201 });
    } catch {
      // code の unique 制約違反時のみリトライする（他のエラーは次のループでも再現するため無限リトライにはならない）
    }
  }

  return NextResponse.json({ error: "failed to generate code" }, { status: 500 });
}
