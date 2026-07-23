import { readFileSync } from "node:fs";
import { z } from "zod";

const sourceSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  listUrls: z.array(z.string().url()).min(1),
  siteUrl: z.string().url(),
  parser: z.enum(["gigaviewer", "magapoke"]),
  enabled: z.boolean(),
  favicon: z.string(),
  fallbackSourceKey: z.string().min(1).optional(),
});

const sourcesFileSchema = z.object({
  $schema: z.string().optional(),
  sources: z.array(sourceSchema),
});

export type Source = z.infer<typeof sourceSchema>;

export function loadSources(filePath: string): Source[] {
  const raw = JSON.parse(readFileSync(filePath, "utf-8"));
  return sourcesFileSchema.parse(raw).sources;
}

export function loadEnabledSources(filePath: string): Source[] {
  return loadSources(filePath).filter((source) => source.enabled);
}
