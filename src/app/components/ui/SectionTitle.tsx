import clsx from "clsx";

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  center?: boolean;
  className?: string;
}

export default function SectionTitle({
  title,
  subtitle,
  center = false,
  className,
}: SectionTitleProps) {
  return (
    <div className={clsx(center && "text-center", className)}>
      {subtitle && (
        <p className="mb-2 text-sm font-medium uppercase tracking-[0.3em] text-secondary">
          {subtitle}
        </p>
      )}

      <h2 className="text-3xl font-semibold text-heading md:text-5xl">
        {title}
      </h2>
    </div>
  );
}