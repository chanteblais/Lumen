CREATE TABLE "priorities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"intention_id" uuid,
	"scope" text NOT NULL,
	"week_of" text,
	"supersedes_id" uuid,
	"retired_at" timestamp with time zone,
	"retired_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "priorities" ADD CONSTRAINT "priorities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "priorities" ADD CONSTRAINT "priorities_intention_id_intentions_id_fk" FOREIGN KEY ("intention_id") REFERENCES "public"."intentions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "priorities_user_active_idx" ON "priorities" USING btree ("user_id","retired_at");