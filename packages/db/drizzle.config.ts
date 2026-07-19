import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// generate はスキーマの静的解析のみで DB 接続を行わないため、未設定時はダミー値で許容する。
// migrate 等の実接続コマンドは、未設定・不正な値であれば接続エラーとして自然に失敗する。
const databaseUrl = process.env.DATABASE_URL ?? "postgres://placeholder/placeholder";

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
