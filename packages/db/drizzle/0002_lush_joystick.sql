CREATE TABLE "transfer_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "transfer_codes_code_unique" UNIQUE("code")
);
