CREATE TABLE "rhythm_practices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rhythm_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"practiced_on" text NOT NULL,
	"via" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rhythm_practices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "rhythms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"content" text NOT NULL,
	"cadence" text,
	"typical_minutes" integer,
	"supersedes_id" uuid,
	"retired_at" timestamp with time zone,
	"retired_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rhythms" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "rhythm_practices" ADD CONSTRAINT "rhythm_practices_rhythm_id_rhythms_id_fk" FOREIGN KEY ("rhythm_id") REFERENCES "public"."rhythms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rhythm_practices" ADD CONSTRAINT "rhythm_practices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rhythms" ADD CONSTRAINT "rhythms_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "rhythm_practices_day_idx" ON "rhythm_practices" USING btree ("rhythm_id","practiced_on");--> statement-breakpoint
CREATE INDEX "rhythm_practices_user_idx" ON "rhythm_practices" USING btree ("user_id","practiced_on");--> statement-breakpoint
CREATE INDEX "rhythms_user_active_idx" ON "rhythms" USING btree ("user_id","retired_at");