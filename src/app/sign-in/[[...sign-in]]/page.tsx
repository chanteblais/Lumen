import { ReleaseHeldChats } from "@/components/chat/ReleaseHeldChats";
import { Divider } from "@/components/ui/Ornament";
import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="mx-auto flex w-full max-w-[1080px] flex-1 flex-col">
      <ReleaseHeldChats />
      <div className="mb-9 px-1">
        <p className="label">Welcome back</p>
        <div className="my-4"><Divider /></div>
        <p className="label leading-[1.9]">Pick up where you left off.</p>
      </div>
      <div className="flex flex-1 items-start justify-center">
        <SignIn />
      </div>
      <p className="mt-10 pb-6 text-center">
        <Link href="/privacy" className="label label-mute underline-offset-4 hover:underline">
          Privacy
        </Link>
      </p>
    </div>
  );
}
