import { GreetingCard } from "@/components/chat/GreetingCard";
import { Composer } from "@/components/chat/Composer";
import { greeting } from "@/core/ai/greeting";
import { requireUser } from "@/lib/auth";

export default async function Home() {
  const user = await requireUser();
  const lines = greeting({ displayName: user.displayName });
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

      <GreetingCard lines={lines} />

      <Composer />
    </div>
  );
}
