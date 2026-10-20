import { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: Variant;
}

export default function Button({
  children,
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "rounded-full px-6 py-3 text-sm font-medium transition-all duration-300",
        {
          "bg-primary text-white hover:bg-primary-dark":
            variant === "primary",

          "border border-primary text-primary hover:bg-section":
            variant === "secondary",
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}