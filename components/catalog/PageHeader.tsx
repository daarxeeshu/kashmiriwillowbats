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
      {/* Sized explicitly. This used to read `heading-lg`, which is applied in eight
          places across the app and defined in none of them — no stylesheet declares it —
          so every page's H1 was inheriting the body size and rendering at 14px. The
          ramp below is the one `BrandShowcase` already uses for a leading heading, so
          this only supplies the size the markup was always asking for; the font family
          and colour are unchanged. The other seven `heading-lg` call sites are still
          affected. */}
      <h1
        className={cn(
          "mt-3 text-3xl font-semibold tracking-tight sm:text-4xl",
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
