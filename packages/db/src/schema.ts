import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const oneshots = pgTable(
  "oneshots",
  {
    id: serial("id").primaryKey(),
    sourceKey: text("source_key").notNull(),
    title: text("title"),
    author: text("author"),
    thumbnailUrl: text("thumbnail_url"),
    viewerUrl: text("viewer_url").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    year: integer("year"),
    detailsFetchedAt: timestamp("details_fetched_at", { withTimezone: true }),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("oneshots_source_key_viewer_url_unique").on(table.sourceKey, table.viewerUrl),
    index("oneshots_published_at_idx").on(table.publishedAt),
    index("oneshots_details_fetched_at_idx").on(table.detailsFetchedAt),
  ],
);

export const genres = pgTable("genres", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  label: text("label").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export const genreVotes = pgTable(
  "genre_votes",
  {
    id: serial("id").primaryKey(),
    oneshotId: integer("oneshot_id")
      .notNull()
      .references(() => oneshots.id),
    genreId: integer("genre_id")
      .notNull()
      .references(() => genres.id),
    anonymousUserId: uuid("anonymous_user_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("genre_votes_oneshot_genre_user_unique").on(
      table.oneshotId,
      table.genreId,
      table.anonymousUserId,
    ),
    index("genre_votes_oneshot_id_idx").on(table.oneshotId),
  ],
);
