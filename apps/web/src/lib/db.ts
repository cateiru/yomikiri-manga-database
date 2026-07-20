import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb, type Db } from "@yomikiri/db/client-serverless";

export async function getDb(): Promise<Db> {
  const { env } = await getCloudflareContext({ async: true });
  return createDb(env.DATABASE_URL);
}
