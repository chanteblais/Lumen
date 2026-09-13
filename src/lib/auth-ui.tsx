// The UI side of the auth boundary: provider, sign-in/up entry points and the
// signed-in control, wrapped so no component imports Clerk directly.
import { ClerkProvider, Show, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import type { ReactNode } from "react";

const appearance = {
  variables: {
    colorPrimary: "#9c7e4e", // --brass
    colorBackground: "#f8f5ef", // --card
    colorText: "#1b1a17", // --ink
    colorTextSecondary: "#3f3c36", // --ink-soft
    colorNeutral: "#1b1a17",
    colorInputBackground: "#efeae2", // --paper
    borderRadius: "6px",
    fontFamily: "var(--font-garamond), 'EB Garamond', Georgia, serif",
    fontSize: "16px",
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  return <ClerkProvider appearance={appearance}>{children}</ClerkProvider>;
}

/** Sign in / Sign up when signed out; the account button when signed in. */
export function AuthControls() {
  // The slot holds the account button's place while Clerk loads, so the clock beside it doesn't slide over when it arrives.
  return (
    <span className="auth-slot">
      <Show when="signed-out">
        <nav className="flex items-baseline gap-6" aria-label="Account">
          <Link href="/sign-in" className="label auth-link">
            Sign in
          </Link>
          <Link href="/sign-up" className="label auth-link">
            Sign up
          </Link>
        </nav>
      </Show>
      <Show when="signed-in">
        <UserButton />
      </Show>
    </span>
  );
}
