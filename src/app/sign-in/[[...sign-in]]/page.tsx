import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="mx-auto flex w-full max-w-[1080px] flex-1 flex-col">
      <div className="mb-9 px-1">
        <p className="label">Welcome back</p>
        <div className="rule-short my-4 !w-[18px]" />
        <p className="label leading-[1.9]">Pick up where you left off.</p>
      </div>
      <div className="flex flex-1 items-start justify-center">
        <SignIn />
      </div>
    </div>
  );
}
