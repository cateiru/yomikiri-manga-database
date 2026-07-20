import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb, type Db } from "@yomikiri/db/client-serverless";

export function getDb(): Db {
  const { env } = getCloudflareContext();
  return createDb(env.DATABASE_URL);
}
