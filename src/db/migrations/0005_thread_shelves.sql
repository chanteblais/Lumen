ALTER TABLE "threads" ADD COLUMN "parent_id" uuid;--> statement-breakpoint
ALTER TABLE "threads" ADD COLUMN "shelved_by" text;--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_parent_id_threads_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."threads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "threads_parent_idx" ON "threads" USING btree ("parent_id");