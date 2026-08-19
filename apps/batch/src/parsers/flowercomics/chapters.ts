/**
 * flowercomics.jp は Next.js App Router（RSC）製で、作品ページ・ビューワーページ
 * とも話一覧データは可視 DOM ではなく `<script>self.__next_f.push(...)</script>`
 * で埋め込まれる React Flight ペイロード内の、JS 文字列としてエスケープされた
 * JSON（\"id\":... のようにバックスラッシュでエスケープされた形）にのみ存在する。
 * そのため cheerio のセレクタではなく正規表現でこの断片を抜き出す
 */
export interface FlowerComicsChapter {
  id: number;
  updated: string | null;
  priority: number;
}

// "chapters":{"earlyChapters":[...],"latestChapters":[...],"omittedMiddleChapters":[...]} の
// 直後に必ず "isLoggedIn" が続くため、これを終端の目印にして話一覧全体を切り出す
const CHAPTERS_BLOCK_PATTERN = /\\"chapters\\":\{\\"earlyChapters\\":(.*?)\\"isLoggedIn\\"/;
const CHAPTER_ENTRY_PATTERN =
  /\\"id\\":(\d+).*?\\"updated\\":\\"([\d/]*)\\".*?\\"priority\\":(\d+)/g;

/**
 * ページ内（作品ページ・ビューワーページ共通）に埋め込まれた話一覧を抽出する。
 * priority は話番号順（1 が第1話）で、読み切りが後日複数パートに分割される
 * 場合があるため、呼び出し側で priority が最小の話（＝最初のパート）を選ぶ
 */
export function extractChapters(html: string): FlowerComicsChapter[] {
  const block = html.match(CHAPTERS_BLOCK_PATTERN)?.[1];
  if (!block) {
    return [];
  }

  const chapters: FlowerComicsChapter[] = [];
  for (const match of block.matchAll(CHAPTER_ENTRY_PATTERN)) {
    const [, id, updated, priority] = match;
    chapters.push({ id: Number(id), updated: updated || null, priority: Number(priority) });
  }
  return chapters;
}

// 掲載日表記は "2026/07/11" のようなスラッシュ区切り（マガポケ等と同形式）
const DATE_PATTERN = /(\d{4})\/(\d{1,2})\/(\d{1,2})/;

export function parseFlowerComicsDate(text: string | null): Date | null {
  if (!text) {
    return null;
  }
  const match = text.match(DATE_PATTERN);
  if (!match) {
    return null;
  }
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return Number.isNaN(date.getTime()) ? null : date;
}
