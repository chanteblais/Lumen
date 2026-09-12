import { Conversation } from "@/components/chat/Conversation";
import { greeting } from "@/core/ai/greeting";
import { ensureMainConversation, loadRecentMessages } from "@/core/domain/conversations";
import { db } from "@/db/client";
import { recordVisit, requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await requireUser();
  const lastSeenAt = await recordVisit(user);
  const conversation = await ensureMainConversation(db(), user.id);
  const initialMessages = await loadRecentMessages(db(), conversation.id);
  const lines = greeting({ displayName: user.displayName, lastSeenAt });

  return (
    <div className="mx-auto flex w-full max-w-[1080px] flex-1 flex-col">
      <div className="mb-9 px-1">
        <p className="label">Rali</p>
        <div className="rule-short my-4 !w-[18px]" />
        <p className="label leading-[1.9]">
          Same you.
          <br />
          A more focused tomorrow.
        </p>
      </div>

      <Conversation conversationId={conversation.id} initialMessages={initialMessages} greetingLines={lines} />
    </div>
  );
}
