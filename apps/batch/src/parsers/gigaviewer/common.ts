export { buildUrlItem, cleanText, toAbsoluteUrl } from "../shared.js";

const JAPANESE_DATE_PATTERN = /(\d{4})年(\d{1,2})月(\d{1,2})日/;

export function parseJapaneseDate(text: string | null | undefined): Date | null {
  if (!text) {
    return null;
  }
  const match = text.match(JAPANESE_DATE_PATTERN);
  if (!match) {
    return null;
  }
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return Number.isNaN(date.getTime()) ? null : date;
}
