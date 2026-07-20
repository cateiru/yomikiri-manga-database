import type { Source } from "../config/sources.js";

export interface ParsedOneshot {
  title: string;
  author: string | null;
  thumbnailUrl: string | null;
  viewerUrl: string;
  publishedAt: Date | null;
}

export interface Parser {
  parse(html: string, source: Source): ParsedOneshot[];
}
