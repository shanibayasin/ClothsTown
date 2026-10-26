import { InputHTMLAttributes } from "react";
import clsx from "clsx";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export default function Input({
  className,
  ...props
}: InputProps) {
  return (
    <input
      className={clsx(
        "w-full rounded-control border border-border bg-card px-4 py-3 text-text outline-none transition-[var(--transition-ui)] placeholder:text-muted",
        "focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-section disabled:text-muted",
        className
      )}
      {...props}
    />
  );
}