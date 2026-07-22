import type { OneshotListItem } from "./oneshots";

const SITE_URL = "https://yomikiri-manga.com";
const SITE_TITLE = "読み切り漫画データベース";
const SITE_DESCRIPTION = "各漫画配信サービスの読み切り漫画を横断的に一覧できるサービス";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildItemXml(item: OneshotListItem): string {
  const pubDate = new Date(item.publishedAt ?? item.firstSeenAt).toUTCString();

  const descriptionParts: string[] = [];
  if (item.thumbnailUrl) {
    descriptionParts.push(`<img src="${escapeXml(item.thumbnailUrl)}" alt="" />`);
  }
  if (item.author) {
    descriptionParts.push(`著者: ${escapeXml(item.author)}`);
  }
  const description =
    descriptionParts.length > 0
      ? `<description><![CDATA[${descriptionParts.join(" ")}]]></description>`
      : "";

  return [
    "<item>",
    `<title>${escapeXml(item.title)}</title>`,
    `<link>${escapeXml(item.viewerUrl)}</link>`,
    `<guid isPermaLink="false">${escapeXml(item.viewerUrl)}</guid>`,
    `<pubDate>${pubDate}</pubDate>`,
    description,
    "</item>",
  ]
    .filter(Boolean)
    .join("\n");
}

export interface BuildRssFeedOptions {
  items: OneshotListItem[];
  /** このフィード自身の URL（atom:link rel="self" に使用） */
  feedUrl: string;
  /** ジャンル絞り込み時のフィードタイトル補足（例: "ラブコメ・ギャグ"） */
  titleSuffix?: string;
}

export function buildRssFeed({ items, feedUrl, titleSuffix }: BuildRssFeedOptions): string {
  const title = titleSuffix ? `${SITE_TITLE} - ${titleSuffix}` : SITE_TITLE;
  const itemsXml = items.map(buildItemXml).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${escapeXml(title)}</title>
<link>${SITE_URL}/</link>
<atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
<description>${escapeXml(SITE_DESCRIPTION)}</description>
<language>ja</language>
<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${itemsXml}
</channel>
</rss>`;
}
