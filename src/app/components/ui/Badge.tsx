import { ReactNode } from "react";
import clsx from "clsx";

interface BadgeProps {
  children: ReactNode;
  className?: string;
}

export default function Badge({
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex rounded-full bg-secondary/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary",
        className
      )}
    >
      {children}
    </span>
  );
}