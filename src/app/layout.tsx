import type { Metadata } from "next";
import { Cormorant_Garamond, EB_Garamond } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-ui";
import { Sidebar } from "@/components/shell/Sidebar";
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
  // The tab reads like a running head: "Today · Lumen". Home is just "Lumen".
  title: { default: "Lumen", template: "%s · Lumen" },
  description: "A quieter way forward.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${cormorant.variable} ${garamond.variable} h-full`}>
      <body>
        <AuthProvider>
          <TimezoneCapture />
          <div className="shell">
            <Sidebar />
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
