import type { Source } from "../config/sources.js";

export interface ParsedOneshotUrl {
  viewerUrl: string;
}

export interface ParsedViewerDetail {
  title: string;
  author: string | null;
  thumbnailUrl: string | null;
  publishedAt: Date | null;
  year: number | null;
}

export interface Parser {
  parse(html: string, source: Source): ParsedOneshotUrl[];
}
