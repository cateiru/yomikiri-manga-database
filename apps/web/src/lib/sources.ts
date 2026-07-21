import sourcesData from "../../../../sources.json";

interface Source {
  key: string;
  name: string;
  listUrl: string;
  siteUrl: string;
  parser: string;
  enabled: boolean;
  favicon: string;
}

const sources = (sourcesData as { sources: Source[] }).sources;

const sourcesByKey = new Map(sources.map((source) => [source.key, source]));

export function getSourceName(sourceKey: string): string {
  return sourcesByKey.get(sourceKey)?.name ?? sourceKey;
}

export function getSourceFaviconUrl(sourceKey: string): string | null {
  return sourcesByKey.get(sourceKey)?.favicon ?? null;
}

export function listSources(): Source[] {
  return sources.filter((source) => source.enabled);
}
