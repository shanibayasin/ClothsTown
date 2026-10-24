"use client";

import { Check, CreditCard, Snowflake, Truck } from "lucide-react";
import { usePathname } from "next/navigation";

export default function AnnouncementBar() {
  const pathname = usePathname() || "";
  const isAccountPage = pathname === "/login" || pathname === "/register";

  return (
    <div className="bg-[#14242b] text-white">
      <div className={`mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-4 font-medium sm:px-6 lg:px-8 ${isAccountPage ? "h-[30px] text-[8px] sm:h-[30px] sm:text-[9px] lg:h-[30px] lg:px-14 lg:text-[10px]" : "h-7 text-[9px] sm:h-10 sm:text-[11px] lg:h-14 lg:text-[14px]"}`}>
        <div className={`flex min-w-0 items-center ${isAccountPage ? "gap-3 sm:gap-5 lg:gap-6" : "gap-3 sm:gap-5 lg:gap-8"}`}>
          <span className="flex shrink-0 items-center gap-1.5 lg:gap-2">
            <Truck size={13} className={isAccountPage ? "sm:size-[14px] lg:size-[14px]" : "sm:size-4 lg:size-[19px]"} aria-hidden="true" />
            <span>Free Delivery All Over Pakistan</span>
          </span>
          <span className="hidden h-4 w-px bg-white/35 sm:block lg:h-5" />
          <span className="hidden shrink-0 items-center gap-1.5 sm:flex lg:gap-2">
            <CreditCard size={13} className={isAccountPage ? "lg:size-[14px]" : "lg:size-[19px]"} aria-hidden="true" />
            Cash on Delivery Available
          </span>
          <span className="hidden h-4 w-px bg-white/35 md:block lg:h-5" />
          <span className="hidden shrink-0 items-center gap-1.5 md:flex lg:gap-2">
            <Check size={13} className={isAccountPage ? "lg:size-[14px]" : "lg:size-[18px]"} aria-hidden="true" />
            Easy Returns
          </span>
        </div>
        <span className="flex shrink-0 items-center gap-1 sm:gap-1.5 lg:gap-2">
          <Snowflake size={12} className={isAccountPage ? "sm:size-[13px] lg:size-[14px]" : "sm:size-4 lg:size-[20px]"} aria-hidden="true" />
          <span>Discover New Season Styles</span>
        </span>
      </div>
    </div>
  );
}