CREATE TABLE "genre_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"oneshot_id" integer NOT NULL,
	"genre_id" integer NOT NULL,
	"anonymous_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "genres" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"sort_order" integer NOT NULL,
	CONSTRAINT "genres_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "oneshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_key" text NOT NULL,
	"title" text NOT NULL,
	"author" text,
	"thumbnail_url" text,
	"viewer_url" text NOT NULL,
	"published_at" timestamp with time zone,
	"first_seen_at" timestamp with time zone NOT NULL,
	"last_seen_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "genre_votes" ADD CONSTRAINT "genre_votes_oneshot_id_oneshots_id_fk" FOREIGN KEY ("oneshot_id") REFERENCES "public"."oneshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "genre_votes" ADD CONSTRAINT "genre_votes_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "genre_votes_oneshot_genre_user_unique" ON "genre_votes" USING btree ("oneshot_id","genre_id","anonymous_user_id");--> statement-breakpoint
CREATE INDEX "genre_votes_oneshot_id_idx" ON "genre_votes" USING btree ("oneshot_id");--> statement-breakpoint
CREATE UNIQUE INDEX "oneshots_source_key_viewer_url_unique" ON "oneshots" USING btree ("source_key","viewer_url");--> statement-breakpoint
CREATE INDEX "oneshots_published_at_idx" ON "oneshots" USING btree ("published_at");