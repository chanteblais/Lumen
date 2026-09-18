import type { Metadata } from "next";
import { Divider, Tailpiece } from "@/components/ui/Ornament";

export const metadata: Metadata = { title: "Privacy" };

const UPDATED = "13 September 2026";
const CONTACT = "chanteblais@gmail.com";

/**
 * The privacy policy. Public (src/lib/public-paths.ts): Google's consent screen
 * links here, so it must open signed out. Plain facts about what the code does —
 * when a service, a table or what goes to the model changes, this page changes in
 * the same commit (docs/features.md → Privacy). Written by Claude from the code,
 * reviewed by Chanté; not legal advice.
 */
export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-[880px] px-1 pb-14">
      <p className="label">Privacy</p>
      <div className="my-4">
        <Divider />
      </div>

      <article className="max-w-[680px] text-[17px] leading-relaxed text-ink-soft">
        <h1 className="font-display text-[30px] leading-[1.2] text-ink sm:text-[36px]">What Coherence keeps, and where it goes</h1>
        <p className="label label-mute mt-3">Last updated {UPDATED}</p>

        <Section title="Who runs Coherence">
          <p>
            Coherence is run by Chanté Blais. For any question or request about your data, write to <Mail />.
          </p>
        </Section>

        <Section title="What Coherence keeps">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <b className="font-medium text-ink">Your account:</b> your name and email address, and your profile picture if you sign in with Google. Sign-in is handled by Clerk, which keeps these (and your password, if you set one) for Coherence.
            </li>
            <li>
              <b className="font-medium text-ink">What you tell Lumi:</b> your conversation with her (a photo, PDF or text file you share in it is read when you send it and isn&rsquo;t kept: only its name stays); the things you&rsquo;ve said you want to do, with any notes, dates and estimates; your focus sessions; how much you said you had in you on a given day; and what Lumi has come to understand about how you work, including whether you said it or she inferred it.
            </li>
            <li>
              <b className="font-medium text-ink">Your time zone,</b> taken from your browser, so times and days make sense.
            </li>
            <li>
              <b className="font-medium text-ink">A record of changes,</b> such as when something was added or ticked off, which Lumi uses to keep track of where things stand.
            </li>
          </ul>
        </Section>

        <Section title="How it’s used">
          <p>
            Only to run Coherence for you: so Lumi can remember what you&rsquo;ve told her, shape your day with you, and pick up where you left off. Your data isn&rsquo;t sold, isn&rsquo;t used for advertising, and isn&rsquo;t shared beyond the services below. Coherence uses no analytics or tracking tools.
          </p>
        </Section>

        <Section title="The services involved">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <b className="font-medium text-ink">OpenAI.</b> When you talk to Lumi, and when she shapes your day or files away what mattered between visits, the parts she needs (your recent conversation and any file you&rsquo;ve just shared in it, your lists, what she knows about you) are sent to OpenAI&rsquo;s API to produce her reply. Requests are sent with storage turned off. OpenAI says it doesn&rsquo;t train its models on API data, and it may keep requests for up to 30 days to monitor for abuse.
            </li>
            <li>
              <b className="font-medium text-ink">Clerk</b> handles sign-in and your account details.
            </li>
            <li>
              <b className="font-medium text-ink">Supabase</b> hosts the database where everything above is stored.
            </li>
            <li>
              <b className="font-medium text-ink">Vercel</b> hosts the site. Like any web host, it handles your requests and may log technical details such as your IP address.
            </li>
            <li>
              <b className="font-medium text-ink">Google,</b> only if you choose to continue with Google. Coherence then receives your name, email address and profile picture, and nothing else from your Google account: it doesn&rsquo;t read your email, calendar or files. Coherence&rsquo;s use of information received from Google APIs adheres to the Google API Services User Data Policy.
            </li>
            <li>
              <b className="font-medium text-ink">Voice, if you use the microphone.</b> In Chrome, Edge and Safari it uses your browser&rsquo;s built-in speech recognition, which sends the audio to the browser&rsquo;s maker (such as Google or Apple) to turn it into text. In other browsers a speech model runs on your device instead, downloaded once from Hugging Face, and the audio stays on your device. Either way, only the text you choose to send reaches Coherence.
            </li>
          </ul>
        </Section>

        <Section title="In your browser">
          <p>
            Coherence sets a few cookies: Clerk&rsquo;s, to keep you signed in, and its own, to remember your time zone and how you like the menu. It also keeps a couple of small preferences in your browser&rsquo;s storage, such as when Lumi last waved hello. None of them track you.
          </p>
        </Section>

        <Section title="Your choices">
          <p>
            In Settings you can see what Lumi knows about you, correct it, or have her forget it, and you can ask her to do the same in conversation. For a copy of your data, or to delete your account and everything in it, write to <Mail />.
          </p>
          <p className="mt-3">
            Your data is kept for as long as you have an account. When it&rsquo;s deleted, it&rsquo;s removed from Coherence&rsquo;s database; the services above keep their own copies only as their terms say (OpenAI&rsquo;s up to 30 days, for example).
          </p>
        </Section>

        <Section title="If this changes">
          <p>
            This page will be updated and the date above will change. If Coherence starts doing something new with your data, such as reading your email, it will be written here first, and you&rsquo;ll be asked before it happens.
          </p>
        </Section>
      </article>

      <Tailpiece className="mt-14" />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="label">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Mail() {
  return (
    <a href={`mailto:${CONTACT}`} className="text-ink underline decoration-1 underline-offset-2">
      {CONTACT}
    </a>
  );
}
