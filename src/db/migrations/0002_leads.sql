CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"source" text DEFAULT 'email' NOT NULL,
	"source_ref" text NOT NULL,
	"title" text NOT NULL,
	"why" text,
	"list" text,
	"due_at" timestamp with time zone,
	"from_name" text,
	"subject" text,
	"received_at" timestamp with time zone,
	"status" text DEFAULT 'suggested' NOT NULL,
	"intention_id" uuid,
	"suggested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_intention_id_intentions_id_fk" FOREIGN KEY ("intention_id") REFERENCES "public"."intentions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "leads_user_status_idx" ON "leads" USING btree ("user_id","status","suggested_at");--> statement-breakpoint
CREATE INDEX "leads_user_ref_idx" ON "leads" USING btree ("user_id","source_ref");