import { after } from "next/server";
import { Conversation } from "@/components/chat/Conversation";
import { LibraryDebug } from "@/components/library/LibraryDebug";
import { RoomScene } from "@/components/shell/RoomScene";
import { listOpenIntentions } from "@/core/domain/intentions";
import { Divider } from "@/components/ui/Ornament";
import { greeting } from "@/core/ai/greeting";
import { consolidateAfter } from "@/core/ai/consolidate";
import { reflectAfterSession } from "@/core/ai/reflect";
import { primeTodaysPlan } from "@/core/ai/today-plan";
import { ensureMainConversation, isInSitting, loadRecentMainMessages } from "@/core/domain/conversations";
import { resolveSession, toSessionView } from "@/core/domain/sessions";
import { currentSitting, visitBeforeSitting } from "@/core/domain/users";
import { db } from "@/db/client";
import { requireVisit } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  // One round trip (the user and the visit), then everything else at once.
  const { user, previous } = await requireVisit();
  // Cut today's path now, off the response, so Today opens with it ready.
  after(() => primeTodaysPlan(db(), user));
  // Fold the last visit's conversation into Lumi's memory (an episode, the Library), off the response.
  after(() => consolidateAfter(db(), user));
  const [conversation, initialMessages, open, sitting, session] = await Promise.all([
    ensureMainConversation(db(), user.id),
    loadRecentMainMessages(db(), user.id),
    listOpenIntentions(db(), user.id),
    currentSitting(db(), user.id),
    // Sweeps a session left open past its threshold (closed as abandoned) and returns what's running.
    resolveSession(db(), user.id),
  ]);
  const intentionTitles = Object.fromEntries(open.map((i) => [i.id, i.title]));
  const inSitting = isInSitting(initialMessages);
  // The greeting reads the gap this sitting began after — so coming back via
  // Today still counts — until they've said something since the sitting began.
  const lastSaid = initialMessages.at(-1)?.metadata?.createdAt;
  const saidThisSitting = sitting ? Boolean(lastSaid && new Date(lastSaid) >= sitting.openedAt) : inSitting;
  // A session that was left open and closed for them: offered back until they've said anything since,
  // and reflected on once (off the response) — leaving a session open is evidence too.
  const abandoned = session.last?.outcome === "abandoned" && session.last.endedAt && (!lastSaid || session.last.endedAt > new Date(lastSaid)) ? session.last : undefined;
  if (session.last?.outcome === "abandoned") {
    const id = session.last.id;
    after(() => reflectAfterSession(db(), user, id));
  }
  const lines = greeting({
    displayName: user.displayName,
    lastSeenAt: sitting && !saidThisSitting ? visitBeforeSitting(sitting) : previous,
    // The second line continues from the last thing said, in their calendar.
    lastSaidAt: lastSaid ? new Date(lastSaid) : undefined,
    timezone: user.timezone,
    abandonedSessionGoal: abandoned?.goal,
  });

  // Keyed: an element passed as a prop across the server/client boundary
  // arrives lazily, and React dev then treats it as an unkeyed list child.
  const kicker = (
    <div key="kicker" className="mb-9 px-1">
      <p className="label">Lumi</p>
      <div className="my-4"><Divider /></div>
      <p className="label leading-[1.9]">
        Same you.
        <br />
        A more focused tomorrow.
      </p>
    </div>
  );

  return (
    <>
      {/* Home is set in the room: the painting fills the viewport behind the shell
          (globals.css → Home: the room); everything else on the page is the same
          conversation, re-lit for the evening. */}
      <RoomScene room="home" />
      <LibraryDebug userId={user.id} />
      <Conversation
        conversationId={conversation.id}
        initialMessages={initialMessages}
        greetingLines={lines}
        kicker={kicker}
        initialInSitting={inSitting}
        intentionTitles={intentionTitles}
        initialSession={session.active ? toSessionView(session.active) : null}
      />
    </>
  );
}
