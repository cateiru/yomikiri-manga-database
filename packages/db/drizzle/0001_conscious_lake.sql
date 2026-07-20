ALTER TABLE "oneshots" ALTER COLUMN "title" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "oneshots" ADD COLUMN "year" integer;--> statement-breakpoint
ALTER TABLE "oneshots" ADD COLUMN "details_fetched_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "oneshots_details_fetched_at_idx" ON "oneshots" USING btree ("details_fetched_at");