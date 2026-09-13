import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Cormorant_Garamond, EB_Garamond } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-ui";
import { Sidebar } from "@/components/shell/Sidebar";
import { NAV_PIN_COOKIE } from "@/components/shell/nav-pin";
import { TopBar } from "@/components/shell/TopBar";
import { TimezoneCapture } from "@/components/shell/TimezoneCapture";
import { LumiCompanion } from "@/components/shell/LumiCompanion";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const garamond = EB_Garamond({
  variable: "--font-garamond",
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  // The tab reads like a running head: "Today · Coherence". Home is just "Coherence".
  title: { default: "Coherence", template: "%s · Coherence" },
  description: "A quieter way forward.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const navPinned = (await cookies()).get(NAV_PIN_COOKIE)?.value === "pinned";
  return (
    <html lang="en" className={`${cormorant.variable} ${garamond.variable} h-full`}>
      <body>
        <AuthProvider>
          <TimezoneCapture />
          <div className="shell">
            <Sidebar pinnedAtLoad={navPinned} />
            <main className="main">
              <TopBar />
              {children}
            </main>
          </div>
          <LumiCompanion />
        </AuthProvider>
      </body>
    </html>
  );
}
