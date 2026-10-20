import { Check, CreditCard, Snowflake, Truck } from "lucide-react";

export default function AnnouncementBar() {
  return (
    <div className="bg-[#14242b] text-white">
      <div className="mx-auto flex h-7 max-w-[1440px] items-center justify-between gap-3 px-4 text-[9px] font-medium sm:h-10 sm:px-6 sm:text-[11px] lg:h-14 lg:px-8 lg:text-[14px]">
        <div className="flex min-w-0 items-center gap-3 sm:gap-5 lg:gap-8">
          <span className="flex shrink-0 items-center gap-1.5 lg:gap-2">
            <Truck size={13} className="sm:size-4 lg:size-[19px]" aria-hidden="true" />
            <span>Free Delivery All Over Pakistan</span>
          </span>
          <span className="hidden h-4 w-px bg-white/35 sm:block lg:h-5" />
          <span className="hidden shrink-0 items-center gap-1.5 sm:flex lg:gap-2">
            <CreditCard size={13} className="lg:size-[19px]" aria-hidden="true" />
            Cash on Delivery Available
          </span>
          <span className="hidden h-4 w-px bg-white/35 md:block lg:h-5" />
          <span className="hidden shrink-0 items-center gap-1.5 md:flex lg:gap-2">
            <Check size={13} className="lg:size-[18px]" aria-hidden="true" />
            Easy Returns
          </span>
        </div>
        <span className="flex shrink-0 items-center gap-1 sm:gap-1.5 lg:gap-2">
          <Snowflake size={12} className="sm:size-4 lg:size-[20px]" aria-hidden="true" />
          <span>Winter Collection 2025</span>
        </span>
      </div>
    </div>
  );
}