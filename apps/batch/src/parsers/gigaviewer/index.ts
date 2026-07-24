import * as cheerio from "cheerio";
import type { Source } from "../../config/sources.js";
import type { ParsedOneshotUrl, Parser } from "../types.js";
import { extract as comicAction } from "./sources/comic-action.js";
import { extract as comicDays } from "./sources/comic-days.js";
import { extract as comicEarthstar } from "./sources/comic-earthstar.js";
import { extract as comicGardo } from "./sources/comic-gardo.js";
import { extract as comicTrail } from "./sources/comic-trail.js";
import { extract as comicYOurs } from "./sources/comic-y-ours.js";
import { extract as comicbunchKai } from "./sources/comicbunch-kai.js";
import { extract as getsumagakichi } from "./sources/getsumagakichi.js";
import { extract as ichijinPlus } from "./sources/ichijin-plus.js";
import { extract as jumpPlus } from "./sources/jump-plus.js";
import { extract as kuragebunch } from "./sources/kuragebunch.js";
import { extract as magcomi } from "./sources/magcomi.js";
import { extract as mangatimeSquare } from "./sources/mangatime-square.js";
import { extract as morningTwo } from "./sources/morning-two.js";
import { extract as ourfeel } from "./sources/ourfeel.js";
import { extract as sundayWebry } from "./sources/sunday-webry.js";
import { extract as tonarinoyj } from "./sources/tonarinoyj.js";
import { extract as zenonPlus } from "./sources/zenon-plus.js";

type Extractor = ($: cheerio.CheerioAPI, source: Source) => ParsedOneshotUrl[];

const registry: Record<string, Extractor> = {
  "comic-days": comicDays,
  "jump-plus": jumpPlus,
  tonarinoyj,
  kuragebunch,
  "comic-gardo": comicGardo,
  "zenon-plus": zenonPlus,
  magcomi,
  "comic-action": comicAction,
  "comic-trail": comicTrail,
  "mangatime-square": mangatimeSquare,
  "sunday-webry": sundayWebry,
  "comic-earthstar": comicEarthstar,
  "ichijin-plus": ichijinPlus,
  "comic-y-ours": comicYOurs,
  "morning-two": morningTwo,
  getsumagakichi,
  "comicbunch-kai": comicbunchKai,
  ourfeel,
};

export function assertSupportedSources(sources: Source[]): void {
  for (const source of sources) {
    if (source.parser !== "gigaviewer") {
      continue;
    }
    if (!(source.key in registry)) {
      throw new Error(`未対応の source.key です: ${source.key}`);
    }
  }
}

export const gigaviewerParser: Parser = {
  parse(html, source) {
    const extractor = registry[source.key];
    if (!extractor) {
      throw new Error(`未対応の source.key です: ${source.key}`);
    }
    const $ = cheerio.load(html);
    return extractor($, source);
  },
};
