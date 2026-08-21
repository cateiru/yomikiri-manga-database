import type { CheerioAPI } from "cheerio";
import type { Source } from "../config/sources.js";
import { ciaoParser } from "./ciao/index.js";
import { extractViewerDetail as extractCiaoDetail } from "./ciao/viewerDetail.js";
import { comicBoostParser } from "./comic-boost/index.js";
import { extractViewerDetail as extractComicBoostDetail } from "./comic-boost/viewerDetail.js";
import { comicFuzParser } from "./comic-fuz/index.js";
import { extractViewerDetail as extractComicFuzDetail } from "./comic-fuz/viewerDetail.js";
import { comicWalkerParser } from "./comic-walker/index.js";
import { extractViewerDetail as extractComicWalkerDetail } from "./comic-walker/viewerDetail.js";
import { comiciParser } from "./comici/index.js";
import { extractViewerDetail as extractComiciDetail } from "./comici/viewerDetail.js";
import { flowercomicsParser } from "./flowercomics/index.js";
import { extractViewerDetail as extractFlowercomicsDetail } from "./flowercomics/viewerDetail.js";
import { assertSupportedSources, gigaviewerParser } from "./gigaviewer/index.js";
import { extractViewerDetail as extractGigaviewerDetail } from "./gigaviewer/viewerDetail.js";
import { kirapoParser } from "./kirapo/index.js";
import { magapokeParser } from "./magapoke/index.js";
import { extractViewerDetail as extractMagapokeDetail } from "./magapoke/viewerDetail.js";
import { mangaOneParser } from "./manga-one/index.js";
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
    case "comic-fuz":
      return comicFuzParser;
    case "comic-boost":
      return comicBoostParser;
    case "flowercomics":
      return flowercomicsParser;
    case "kirapo":
      return kirapoParser;
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
    case "comic-fuz":
      return extractComicFuzDetail($, viewerUrl);
    case "comic-boost":
      return extractComicBoostDetail($, viewerUrl);
    case "flowercomics":
      return extractFlowercomicsDetail($, viewerUrl);
    case "kirapo":
      // きらポはビューワーページ（BinB Reader）に詳細情報を含まないため
      // fetchViewerDetail（作品ページへの追加フェッチ）を使う。fetchDetails.ts は
      // parser.fetchViewerDetail の有無でこの関数自体を呼ばないため、誤って
      // 呼ばれた場合のみ到達する
      throw new Error(
        "kirapo は extractViewerDetail 未対応です（fetchViewerDetail を使用してください）",
      );
  }
}
