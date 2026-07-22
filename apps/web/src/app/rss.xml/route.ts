import { getDb } from "@/lib/db";
import { listGenres } from "@/lib/genres";
import { getOneshotsPage } from "@/lib/oneshots";
import { buildRssFeed } from "@/lib/rss";

export const dynamic = "force-dynamic";

const RSS_ITEM_COUNT = 50;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const genreKeys = searchParams.getAll("genre");

  const db = await getDb();
  const [genresList, page] = await Promise.all([
    listGenres(db),
    getOneshotsPage(genreKeys, null, RSS_ITEM_COUNT),
  ]);

  const titleSuffix =
    genreKeys.length > 0
      ? genresList
          .filter((genre) => genreKeys.includes(genre.key))
          .map((genre) => genre.label)
          .join("・")
      : undefined;

  const xml = buildRssFeed({ items: page.items, feedUrl: request.url, titleSuffix });

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
