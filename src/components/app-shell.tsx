"use client";

import { useState } from "react";
import { TopBar } from "./top-bar";
import { LiveTicker } from "./live-ticker";
import { SportTabs } from "./sport-tabs";
import { Sidebar, MobileSidebar } from "./sidebar";
import { DesktopBetSlip, MobileBetSlip } from "./bet-slip";
import { MobileNav } from "./mobile-nav";
import { SupportChat } from "./support-chat";
import { SiteFooter } from "./site-footer";

export function AppShell({
  children,
  betSlip = true,
  tabs = true,
}: {
  children: React.ReactNode;
  betSlip?: boolean;
  tabs?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-dvh">
      <TopBar onMenu={() => setMenuOpen(true)} />
      <LiveTicker />
      {tabs && <SportTabs />}

      <div className="mx-auto max-w-[1600px] flex gap-0 lg:gap-4 px-0 lg:px-4">
        <Sidebar />
        {/* Bottom padding clears the docked mobile nav (54px) plus the
 collapsed bet-slip bar that sits above it. */}
        <main className="flex-1 min-w-0 px-2.5 sm:px-3 lg:px-0 py-3 pb-32 xl:pb-6">
          {children}
        </main>
        {betSlip && <DesktopBetSlip />}
      </div>

      <SiteFooter />

      <MobileSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <MobileBetSlip />
      <MobileNav />
      <SupportChat />
    </div>
  );
}
