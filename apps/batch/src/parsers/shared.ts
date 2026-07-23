import type { Source } from "../config/sources.js";
import { log } from "../logger.js";
import type { ParsedOneshotUrl } from "./types.js";

export function cleanText(text: string | null | undefined): string | null {
  if (!text) {
    return null;
  }
  const trimmed = text.replace(/\s+/g, " ").trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function toAbsoluteUrl(href: string | null | undefined, base: string): string | null {
  if (!href) {
    return null;
  }
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

interface BuildUrlItemParams {
  source: Source;
  viewerUrlRaw: string | null | undefined;
}

export function buildUrlItem(params: BuildUrlItemParams): ParsedOneshotUrl | null {
  const viewerUrl = toAbsoluteUrl(params.viewerUrlRaw, params.source.siteUrl);

  if (!viewerUrl) {
    log("warn", "ビューワー URL を抽出できなかったため要素をスキップしました", {
      sourceKey: params.source.key,
      viewerUrlRaw: params.viewerUrlRaw,
    });
    return null;
  }

  return { viewerUrl };
}
