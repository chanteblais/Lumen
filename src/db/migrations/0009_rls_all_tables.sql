ALTER TABLE "conversations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "day_plans" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "design_contribution_revisions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "design_contributions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "design_digests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "episodes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "focus_sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "intentions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "leads" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "memory_notes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "priorities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "thread_notes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "threads" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
-- Supabase's Data API roles get no privileges in public, now or on future tables.
-- Hand-written; skipped where the roles don't exist (the PGlite test database).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
    REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
  END IF;
END $$;
