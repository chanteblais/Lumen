import { Divider } from "@/components/ui/Ornament";
import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="mx-auto flex w-full max-w-[1080px] flex-1 flex-col">
      <div className="mb-9 px-1">
        <p className="label">Hello</p>
        <div className="my-4"><Divider /></div>
        <p className="label leading-[1.9]">A quieter way forward starts here.</p>
      </div>
      <div className="flex flex-1 items-start justify-center">
        <SignUp />
      </div>
      <p className="mt-10 pb-6 text-center">
        <Link href="/privacy" className="label label-mute underline-offset-4 hover:underline">
          Privacy
        </Link>
      </p>
    </div>
  );
}
