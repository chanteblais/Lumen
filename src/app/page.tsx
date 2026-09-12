import { Suspense } from "react";
import { Conversation } from "@/components/chat/Conversation";
import { listOpenIntentions } from "@/core/domain/intentions";
import { Divider } from "@/components/ui/Ornament";
import { greeting } from "@/core/ai/greeting";
import { ensureMainConversation, isInSitting, loadRecentMessages } from "@/core/domain/conversations";
import { db } from "@/db/client";
import { recordVisit, requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await requireUser();
  const lastSeenAt = await recordVisit(user);
  const conversation = await ensureMainConversation(db(), user.id);
  const [initialMessages, open] = await Promise.all([loadRecentMessages(db(), conversation.id), listOpenIntentions(db(), user.id)]);
  const intentionTitles = Object.fromEntries(open.map((i) => [i.id, i.title]));
  const lines = greeting({ displayName: user.displayName, lastSeenAt });

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
    <Suspense>
      <Conversation
        conversationId={conversation.id}
        initialMessages={initialMessages}
        greetingLines={lines}
        kicker={kicker}
        initialInSitting={isInSitting(initialMessages)}
        intentionTitles={intentionTitles}
      />
    </Suspense>
  );
}
