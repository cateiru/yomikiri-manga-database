import type { Db } from "@yomikiri/db/client-node";
import { transferCodes } from "@yomikiri/db/schema";
import { lt } from "drizzle-orm";

/**
 * 有効期限（発行から24時間）を過ぎたデータ引き継ぎコードを物理削除する。
 * 有効期限内かどうかの正しさは redeem API 側の判定で担保されているため、
 * このバッチは未使用のまま期限切れになったレコードのストレージ節約が目的。
 */
export async function deleteExpiredTransferCodes(db: Db): Promise<number> {
  const deleted = await db
    .delete(transferCodes)
    .where(lt(transferCodes.expiresAt, new Date()))
    .returning({ id: transferCodes.id });
  return deleted.length;
}
