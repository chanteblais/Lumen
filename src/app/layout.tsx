import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Cormorant_Garamond, EB_Garamond } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-ui";
import { Sidebar } from "@/components/shell/Sidebar";
import { NAV_MODE_COOKIE, navModeFrom } from "@/components/shell/nav-pin";
import { TopBar } from "@/components/shell/TopBar";
import { TimezoneCapture } from "@/components/shell/TimezoneCapture";
import { FreshOnReturn } from "@/components/shell/FreshOnReturn";
import { LumiCompanion } from "@/components/shell/LumiCompanion";
import { SCENE_FADE_SCRIPT } from "@/components/shell/RoomScene";
import { OPEN_ON_CARD_SCRIPT } from "@/components/chat/open-on-card";

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

export default async function RootLayout({ children, sheet }: LayoutProps<"/">) {
  const navMode = navModeFrom((await cookies()).get(NAV_MODE_COOKIE)?.value);
  return (
    <html lang="en" className={`${cormorant.variable} ${garamond.variable} h-full`}>
      <body>
        {/* First in the body, so it is watching before any room's painting is parsed (RoomScene). */}
        <script dangerouslySetInnerHTML={{ __html: SCENE_FADE_SCRIPT }} />
        {/* Likewise before the chat is parsed: it opens on the greeting card from the first paint (MessageList). */}
        <script dangerouslySetInnerHTML={{ __html: OPEN_ON_CARD_SCRIPT }} />
        <AuthProvider>
          <TimezoneCapture />
          <FreshOnReturn />
          <div className="shell">
            <Sidebar modeAtLoad={navMode} />
            <main className="main">
              <TopBar />
              {children}
            </main>
            {/* A sheet opened from the nav (Lists), over the page underneath: app/@sheet. */}
            {sheet}
          </div>
          <LumiCompanion />
        </AuthProvider>
      </body>
    </html>
  );
}
