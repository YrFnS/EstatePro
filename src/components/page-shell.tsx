"use client";

import { Navbar } from "@/components/real-estate/navbar";
import { Footer } from "@/components/real-estate/footer";
import { BackToTopButton } from "@/components/real-estate/back-to-top";
import { AIChatWidget } from "@/components/real-estate/ai-chat-widget";

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex-1 page-view-enter">
        {children}
      </main>
      <Footer />
      <BackToTopButton />
      <AIChatWidget />
    </>
  );
}
