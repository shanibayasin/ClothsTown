"use client";

import { usePathname } from "next/navigation";

export default function AnnouncementBar() {
  const pathname = usePathname() || "";
  const isAccountPage = pathname === "/login" || pathname === "/register";

  return (
    <div className="bg-primary text-white">
      <div
        role="region"
        aria-label="Store announcement"
        className={`announcement-marquee-viewport mx-auto flex max-w-[1440px] items-center overflow-hidden px-4 font-medium sm:px-6 lg:px-8 ${
          isAccountPage
            ? "h-4 text-[7px] sm:h-5 sm:text-[8px] lg:h-6 lg:px-14 lg:text-[9px]"
            : "h-4 text-[7px] sm:h-5 sm:text-[8px] lg:h-6 lg:text-[9px]"
        }`}
      >
        <div className="announcement-marquee-track flex w-max items-center">
          <p className="shrink-0 whitespace-nowrap px-4 uppercase tracking-[0.12em]">
            WELCOME TO CLOTHESTOWN ✦ ELEVATE YOUR STYLE WITH TIMELESS FASHION ✦
            DISCOVER EXCLUSIVE COLLECTIONS ✦ DRESS BETTER. FEEL BETTER. ✦
          </p>
          <p
            aria-hidden="true"
            className="shrink-0 whitespace-nowrap px-4 uppercase tracking-[0.12em]"
          >
            WELCOME TO CLOTHESTOWN ✦ ELEVATE YOUR STYLE WITH TIMELESS FASHION ✦
            DISCOVER EXCLUSIVE COLLECTIONS ✦ DRESS BETTER. FEEL BETTER. ✦
          </p>
        </div>
      </div>
    </div>
  );
}