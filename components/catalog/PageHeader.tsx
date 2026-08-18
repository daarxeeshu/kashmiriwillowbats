import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  dark?: boolean;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  className,
  dark = false,
}: PageHeaderProps) {
  return (
    <header className={cn("max-w-3xl", className)}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1
        className={cn(
          "heading-lg mt-3",
          dark ? "text-white" : "text-foreground",
        )}
      >
        {title}
      </h1>
      {description && (
        <p
          className={cn(
            "mt-3 text-base leading-relaxed",
            dark ? "text-white/75" : "text-muted-foreground",
          )}
        >
          {description}
        </p>
      )}
    </header>
  );
}
