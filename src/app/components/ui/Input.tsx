import { InputHTMLAttributes } from "react";
import clsx from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export default function Input({
  className,
  ...props
}: InputProps) {
  return (
    <input
      className={clsx(
        "w-full rounded-xl border border-border bg-white px-4 py-3 outline-none transition-all",
        "focus:border-primary focus:ring-2 focus:ring-primary/20",
        className
      )}
      {...props}
    />
  );
}