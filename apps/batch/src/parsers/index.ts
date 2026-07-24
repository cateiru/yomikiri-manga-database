import type { CheerioAPI } from "cheerio";
import type { Source } from "../config/sources.js";
import { comicWalkerParser } from "./comic-walker/index.js";
import { extractViewerDetail as extractComicWalkerDetail } from "./comic-walker/viewerDetail.js";
import { comiciParser } from "./comici/index.js";
import { extractViewerDetail as extractComiciDetail } from "./comici/viewerDetail.js";
import { assertSupportedSources, gigaviewerParser } from "./gigaviewer/index.js";
import { extractViewerDetail as extractGigaviewerDetail } from "./gigaviewer/viewerDetail.js";
import { magapokeParser } from "./magapoke/index.js";
import { extractViewerDetail as extractMagapokeDetail } from "./magapoke/viewerDetail.js";
import type { ParsedViewerDetail, Parser } from "./types.js";

export { assertSupportedSources };

export function getParser(source: Source): Parser {
  switch (source.parser) {
    case "gigaviewer":
      return gigaviewerParser;
    case "magapoke":
      return magapokeParser;
    case "comic-walker":
      return comicWalkerParser;
    case "comici":
      return comiciParser;
  }
}

export function extractViewerDetail(
  source: Source,
  $: CheerioAPI,
  viewerUrl: string,
): ParsedViewerDetail | null {
  switch (source.parser) {
    case "gigaviewer":
      return extractGigaviewerDetail($, viewerUrl);
    case "magapoke":
      return extractMagapokeDetail($, viewerUrl);
    case "comic-walker":
      return extractComicWalkerDetail($, viewerUrl);
    case "comici":
      return extractComiciDetail($, viewerUrl);
  }
}
