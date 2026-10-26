"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Browser ki default scroll memory ko off karein
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    // Ek clean reset function jo screen ko bina kisi animation ke top par locked rakhe
    const forceScrollTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      document.documentElement.scrollTo({ top: 0, left: 0, behavior: "instant" });
      document.body.scrollTop = 0;
    };

    // 1. Pehla instant click attempt
    forceScrollTop();

    // 2. Mobile engines/safari ke delay ke liye 50ms ka safe timeout hook
    const timeoutId = setTimeout(() => {
      window.requestAnimationFrame(forceScrollTop);
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [pathname]);

  return null;
}