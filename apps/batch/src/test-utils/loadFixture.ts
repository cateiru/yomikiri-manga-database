import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export function loadFixture(key: string): string {
  const path = fileURLToPath(new URL(`../../test/fixtures/${key}.html`, import.meta.url));
  return readFileSync(path, "utf-8");
}
