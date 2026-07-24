import type { CheerioAPI } from "cheerio";
import { cleanText, toAbsoluteUrl } from "../shared.js";
import type { ParsedViewerDetail } from "../types.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * カドコミは Next.js の __NEXT_DATA__ に react-query の dehydratedState として
 * 作品・話数データを埋め込んでいるため、DOM ではなくこの JSON から詳細を抽出する
 */
function findQueryData(queries: unknown[], queryKeyPrefix: string): unknown {
  for (const query of queries) {
    if (!isRecord(query)) {
      continue;
    }
    const queryKey = query.queryKey;
    if (Array.isArray(queryKey) && queryKey[0] === queryKeyPrefix) {
      const state = query.state;
      if (isRecord(state)) {
        return state.data;
      }
    }
  }
  return undefined;
}

function extractQueries(nextData: unknown): unknown[] {
  if (!isRecord(nextData)) {
    return [];
  }
  const props = nextData.props;
  if (!isRecord(props)) {
    return [];
  }
  const pageProps = props.pageProps;
  if (!isRecord(pageProps)) {
    return [];
  }
  const dehydratedState = pageProps.dehydratedState;
  if (!isRecord(dehydratedState)) {
    return [];
  }
  const queries = dehydratedState.queries;
  return Array.isArray(queries) ? queries : [];
}

interface WorkFields {
  title: string | null;
  author: string | null;
  thumbnailUrl: string | null;
}

function extractWorkFields(workQueryData: unknown, viewerUrl: string): WorkFields {
  if (!isRecord(workQueryData)) {
    return { title: null, author: null, thumbnailUrl: null };
  }
  const work = workQueryData.work;
  if (!isRecord(work)) {
    return { title: null, author: null, thumbnailUrl: null };
  }

  const title = typeof work.title === "string" ? cleanText(work.title) : null;
  const thumbnailUrl = toAbsoluteUrl(
    typeof work.thumbnail === "string" ? work.thumbnail : null,
    viewerUrl,
  );

  let author: string | null = null;
  if (Array.isArray(work.authors)) {
    for (const entry of work.authors) {
      if (!isRecord(entry) || typeof entry.name !== "string") {
        continue;
      }
      // 複数の役割（著者・原作等）が並ぶ場合は「著者」を優先し、無ければ先頭を使う
      if (entry.role === "著者") {
        author = entry.name;
        break;
      }
      if (author === null) {
        author = entry.name;
      }
    }
  }

  return { title, author, thumbnailUrl };
}

function extractPublishedAt(episodeQueryData: unknown): Date | null {
  if (!isRecord(episodeQueryData)) {
    return null;
  }
  const episode = episodeQueryData.episode;
  if (!isRecord(episode) || typeof episode.updateDate !== "string") {
    return null;
  }
  const date = new Date(episode.updateDate);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function extractViewerDetail($: CheerioAPI, viewerUrl: string): ParsedViewerDetail | null {
  const scriptText = $("script#__NEXT_DATA__").first().text();
  if (!scriptText) {
    return null;
  }

  let nextData: unknown;
  try {
    nextData = JSON.parse(scriptText);
  } catch {
    return null;
  }

  const queries = extractQueries(nextData);
  const { title, author, thumbnailUrl } = extractWorkFields(
    findQueryData(queries, "/api/contents/details/work"),
    viewerUrl,
  );
  if (!title) {
    return null;
  }

  const publishedAt = extractPublishedAt(findQueryData(queries, "/api/contents/details/episode"));
  const year = publishedAt ? publishedAt.getUTCFullYear() : null;

  return { title, author, thumbnailUrl, publishedAt, year };
}
