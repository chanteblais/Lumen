CREATE TABLE "day_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"local_date" text NOT NULL,
	"capacity" text,
	"plan" jsonb NOT NULL,
	"reason" text NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "intentions" ADD COLUMN "list" text;--> statement-breakpoint
ALTER TABLE "intentions" ADD COLUMN "estimate_minutes" integer;--> statement-breakpoint
ALTER TABLE "day_plans" ADD CONSTRAINT "day_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "day_plans_user_date_idx" ON "day_plans" USING btree ("user_id","local_date","generated_at");