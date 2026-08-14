import type { CheerioAPI } from "cheerio";
import type { Source } from "../config/sources.js";
import { ciaoParser } from "./ciao/index.js";
import { extractViewerDetail as extractCiaoDetail } from "./ciao/viewerDetail.js";
import { comicWalkerParser } from "./comic-walker/index.js";
import { extractViewerDetail as extractComicWalkerDetail } from "./comic-walker/viewerDetail.js";
import { comiciParser } from "./comici/index.js";
import { extractViewerDetail as extractComiciDetail } from "./comici/viewerDetail.js";
import { assertSupportedSources, gigaviewerParser } from "./gigaviewer/index.js";
import { extractViewerDetail as extractGigaviewerDetail } from "./gigaviewer/viewerDetail.js";
import { magapokeParser } from "./magapoke/index.js";
import { extractViewerDetail as extractMagapokeDetail } from "./magapoke/viewerDetail.js";
import { mangaOneParser } from "./manga-one/index.js";
import { mangaUpParser } from "./manga-up/index.js";
import { extractViewerDetail as extractMangaUpDetail } from "./manga-up/viewerDetail.js";
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
    case "ciao":
      return ciaoParser;
    case "manga-one":
      return mangaOneParser;
    case "manga-up":
      return mangaUpParser;
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
    case "ciao":
      return extractCiaoDetail($, viewerUrl);
    case "manga-one":
      // マンガワンは静的 HTML から詳細を得られないため fetchViewerDetail
      // （headless 経由）を使う。fetchDetails.ts は parser.fetchViewerDetail の
      // 有無でこの関数自体を呼ばないため、誤って呼ばれた場合のみ到達する
      throw new Error(
        "manga-one は extractViewerDetail 未対応です（fetchViewerDetail を使用してください）",
      );
    case "manga-up":
      return extractMangaUpDetail($, viewerUrl);
  }
}
