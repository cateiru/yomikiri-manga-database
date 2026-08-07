import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { GenreBadge } from "@/components/GenreBadge";
import { OneshotCard } from "@/components/OneshotCard";
import { SeriesActions } from "@/components/SeriesActions";
import { SeriesThumbnailLink } from "@/components/SeriesThumbnailLink";
import { getDb } from "@/lib/db";
import { listGenres } from "@/lib/genres";
import { getOneshotById, getOneshotsAroundInSource, type OneshotListItem } from "@/lib/oneshots";
import { getSourceFaviconUrl, getSourceName } from "@/lib/sources";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

interface SeriesDetailPageProps {
  params: Promise<{ id: string }>;
}

function parseOneshotId(idParam: string): number | null {
  const id = Number.parseInt(idParam, 10);
  if (!Number.isInteger(id) || id <= 0 || String(id) !== idParam) {
    return null;
  }
  return id;
}

// generateMetadata と Page の両方から呼ばれるため、force-dynamic 下で DB への二重問い合わせを避ける
const loadOneshot = cache((id: number): Promise<OneshotListItem | null> => getOneshotById(id));

export async function generateMetadata({ params }: SeriesDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const oneshotId = parseOneshotId(id);
  if (oneshotId === null) {
    return {};
  }

  const item = await loadOneshot(oneshotId);
  if (!item) {
    return {};
  }

  const title = `${item.title} | 読み切り漫画データベース`;
  const description = item.author
    ? `${item.author}（${getSourceName(item.sourceKey)}）の読み切り作品`
    : `${getSourceName(item.sourceKey)}の読み切り作品`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: item.thumbnailUrl ? [{ url: item.thumbnailUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: item.thumbnailUrl ? [item.thumbnailUrl] : undefined,
    },
  };
}

export default async function SeriesDetailPage({ params }: SeriesDetailPageProps) {
  const { id } = await params;
  const oneshotId = parseOneshotId(id);
  if (oneshotId === null) {
    notFound();
  }

  const db = await getDb();
  const [item, genresList] = await Promise.all([loadOneshot(oneshotId), listGenres(db)]);
  if (!item) {
    notFound();
  }

  const sourceName = getSourceName(item.sourceKey);
  const faviconUrl = getSourceFaviconUrl(item.sourceKey);
  const recommendations = await getOneshotsAroundInSource(item.sourceKey, {
    publishedAt: item.publishedAt,
    title: item.title,
    id: item.id,
  });

  return (
    <main className={styles.main}>
      <article className={styles.article}>
        <div className={styles.thumbnailFrame}>
          <SeriesThumbnailLink item={item} />
        </div>
        <div className={styles.body}>
          <h1 className={styles.title}>{item.title}</h1>
          {item.author ? <p className={styles.author}>{item.author}</p> : null}
          <p className={styles.source}>
            {faviconUrl ? (
              <img className={styles.favicon} src={faviconUrl} alt="" aria-hidden="true" />
            ) : null}
            {sourceName}
          </p>

          {item.genres.length > 0 ? (
            <section className={styles.section}>
              <h2 className={styles.sectionHeading}>設定されているジャンル</h2>
              <ul className={styles.genres}>
                {item.genres.map((genre, index) => (
                  <li key={genre.id}>
                    <GenreBadge label={genre.label} rank={index + 1} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <SeriesActions item={item} genres={genresList} />

          {item.genres.length > 0 ? (
            <section className={styles.section}>
              <h2 className={styles.sectionHeading}>同じジャンルの作品を探す</h2>
              <ul className={styles.genreLinks}>
                {item.genres.map((genre) => (
                  <li key={genre.id}>
                    <Link className={styles.genreLink} href={`/?genre=${genre.key}`}>
                      {genre.label}の作品を探す
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </article>

      {recommendations.length > 0 ? (
        <section className={styles.recommendations}>
          <h2 className={styles.recommendationsHeading}>{sourceName}のほかの作品</h2>
          <ul className={styles.recommendationsGrid}>
            {recommendations.map((recommendation) => (
              <li key={recommendation.id}>
                <OneshotCard item={recommendation} />
              </li>
            ))}
          </ul>
          <Link className={styles.exploreLink} href="/">
            他の読み切り漫画を探す
          </Link>
        </section>
      ) : null}
    </main>
  );
}
