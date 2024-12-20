CREATE TYPE "public"."provider" AS ENUM('email', 'google');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "authentications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"password_hash" text,
	"provider" "provider" NOT NULL,
	"provider_id" text,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"updated_at" timestamp (3) with time zone
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "authentications" ADD CONSTRAINT "authentications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "authentications_provider_provider_id_index" ON "authentications" USING btree ("provider","provider_id");--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "password";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");