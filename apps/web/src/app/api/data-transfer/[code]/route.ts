import { transferCodes } from "@yomikiri/db/schema";
import { and, eq, gt } from "drizzle-orm";
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

const redeemRequestSchema = z.object({
  mode: z.enum(["overwrite", "merge"]),
});

interface RouteParams {
  params: Promise<{ code: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  const { code } = await params;

  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "too many requests" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = redeemRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const db = await getDb();

  const rows = await db
    .delete(transferCodes)
    .where(and(eq(transferCodes.code, code), gt(transferCodes.expiresAt, new Date())))
    .returning({ payload: transferCodes.payload });

  const row = rows[0];
  if (!row) {
    return NextResponse.json({ error: "invalid or expired code" }, { status: 404 });
  }

  return NextResponse.json({ payload: row.payload, mode: parsed.data.mode }, { status: 200 });
}
