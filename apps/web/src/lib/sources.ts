import sourcesData from "../../../../sources.json";

interface Source {
  key: string;
  name: string;
  listUrl: string;
  parser: string;
  enabled: boolean;
  favicon: string;
}

const sourcesByKey = new Map(
  (sourcesData as { sources: Source[] }).sources.map((source) => [source.key, source]),
);

export function getSourceName(sourceKey: string): string {
  return sourcesByKey.get(sourceKey)?.name ?? sourceKey;
}

export function getSourceFaviconUrl(sourceKey: string): string | null {
  return sourcesByKey.get(sourceKey)?.favicon ?? null;
}
