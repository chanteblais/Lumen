/**
 * What Lumi can read from the user's mail — the smallest shape that lets her
 * notice things that might need doing. Framework-free; the Gmail
 * implementation is in ./gmail.ts and the token comes from src/lib (Clerk).
 */
export type EmailMessage = {
  /** Provider id — the lead's `source_ref`. */
  id: string;
  threadId: string;
  fromName: string;
  fromAddress: string;
  subject: string;
  receivedAt: Date;
  /** Plain text, quoted replies stripped, truncated. Never stored. */
  text: string;
};

export type RecentMailQuery = {
  /** Only messages newer than this. */
  since: Date;
  /** Hard cap on messages read. */
  max?: number;
  /** Optional free-text search in the provider's own syntax (Gmail: "from:priya", "invoice"). */
  search?: string;
};

export interface EmailReader {
  recent(q: RecentMailQuery): Promise<EmailMessage[]>;
}

/** The Gmail scope Lumi needs. Read-only, and only ever read-only. */
export const GMAIL_READONLY_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";

/**
 * Mail is switched off (Chanté, 2026-09-13), so Google sign-in asks for
 * nothing restricted and the consent screen can be published without Google's
 * review. Off: no Insights in the nav (`/insights` goes Home), no Connect
 * Google chip, no mail tools and no *Their mail* in Lumi's context. Leads
 * already noticed stay in the database. Turning it back on also needs
 * `gmail.readonly` back on the consent screen (docs/pre-prod.md).
 */
export const MAIL_ON: boolean = false;
