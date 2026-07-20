import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

// NEON_LOCAL_WS_PROXY はローカル開発（docker compose）でのみ設定される。
// Neon 本番環境には存在しない値なので、本番の接続経路には影響しない。
const localWsProxy = process.env.NEON_LOCAL_WS_PROXY;
if (localWsProxy) {
  neonConfig.wsProxy = localWsProxy;
  neonConfig.useSecureWebSocket = false;
  neonConfig.pipelineConnect = false;
}

export function createDb(databaseUrl: string) {
  const pool = new Pool({ connectionString: databaseUrl });
  return drizzle(pool, { schema });
}

export type Db = ReturnType<typeof createDb>;
