ALTER TABLE "conversations" ADD COLUMN "consolidating_until" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "conversations_user_main_idx" ON "conversations" USING btree ("user_id") WHERE "conversations"."kind" = 'main';--> statement-breakpoint
CREATE INDEX "episodes_thread_ids_idx" ON "episodes" USING gin ("thread_ids");--> statement-breakpoint
CREATE UNIQUE INDEX "events_reflection_claim_idx" ON "events" USING btree ("user_id","subject_id") WHERE "events"."type" = 'reflection.claimed';--> statement-breakpoint
CREATE UNIQUE INDEX "focus_sessions_user_open_idx" ON "focus_sessions" USING btree ("user_id") WHERE "focus_sessions"."ended_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "leads_user_ref_title_idx" ON "leads" USING btree ("user_id","source_ref",lower("title"));