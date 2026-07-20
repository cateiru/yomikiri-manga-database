import sourcesData from "../../../../sources.json";

interface Source {
  key: string;
  name: string;
  listUrl: string;
  parser: string;
  enabled: boolean;
}

const sourcesByKey = new Map(
  (sourcesData as { sources: Source[] }).sources.map((source) => [source.key, source]),
);

export function getSourceName(sourceKey: string): string {
  return sourcesByKey.get(sourceKey)?.name ?? sourceKey;
}

export function getSourceFaviconUrl(sourceKey: string): string | null {
  const source = sourcesByKey.get(sourceKey);
  if (!source) {
    return null;
  }
  return `${new URL(source.listUrl).origin}/favicon.ico`;
}
