import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export function loadFixture(key: string, extension = "html"): string {
  const path = fileURLToPath(new URL(`../../test/fixtures/${key}.${extension}`, import.meta.url));
  return readFileSync(path, "utf-8");
}
