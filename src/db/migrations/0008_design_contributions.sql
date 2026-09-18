CREATE TABLE "design_contribution_revisions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"contribution_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"change" text NOT NULL,
	"actor" text NOT NULL,
	"target" text,
	"verdict" text,
	"their_words" text,
	"note" text,
	"snapshot" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "design_contributions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"ref" integer NOT NULL,
	"kind" text NOT NULL,
	"area" text,
	"title" text NOT NULL,
	"insight" text NOT NULL,
	"stated_direction" text,
	"stated_source" text,
	"possibility" text,
	"why_it_matters" text,
	"uncertainty" text,
	"prompted_by" text,
	"source_message_id" uuid,
	"related_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"supersedes_id" uuid,
	"superseded_by_id" uuid,
	"insight_status" text DEFAULT 'unreviewed' NOT NULL,
	"possibility_status" text,
	"retracted_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "design_digests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"from_revision_id" bigint NOT NULL,
	"through_revision_id" bigint NOT NULL,
	"local_date" text NOT NULL,
	"markdown" text,
	"contribution_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "design_contribution_revisions" ADD CONSTRAINT "design_contribution_revisions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_contribution_revisions" ADD CONSTRAINT "design_contribution_revisions_contribution_id_design_contributions_id_fk" FOREIGN KEY ("contribution_id") REFERENCES "public"."design_contributions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_contributions" ADD CONSTRAINT "design_contributions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_contributions" ADD CONSTRAINT "design_contributions_supersedes_id_design_contributions_id_fk" FOREIGN KEY ("supersedes_id") REFERENCES "public"."design_contributions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_contributions" ADD CONSTRAINT "design_contributions_superseded_by_id_design_contributions_id_fk" FOREIGN KEY ("superseded_by_id") REFERENCES "public"."design_contributions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_digests" ADD CONSTRAINT "design_digests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "design_revisions_user_idx" ON "design_contribution_revisions" USING btree ("user_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "design_revisions_version_idx" ON "design_contribution_revisions" USING btree ("contribution_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "design_contributions_user_ref_idx" ON "design_contributions" USING btree ("user_id","ref");--> statement-breakpoint
CREATE INDEX "design_contributions_user_updated_idx" ON "design_contributions" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "design_digests_user_from_idx" ON "design_digests" USING btree ("user_id","from_revision_id");--> statement-breakpoint
CREATE INDEX "design_digests_user_through_idx" ON "design_digests" USING btree ("user_id","through_revision_id");