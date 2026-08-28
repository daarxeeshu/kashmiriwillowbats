import { cn } from "@/lib/utils";
import { FadeIn } from "@/components/ui/FadeIn";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
  dark?: boolean;
  /**
   * Applied to the `<h2>`. Sections that label themselves with
   * `aria-labelledby` must pass this, or the reference dangles and the
   * section ends up with no accessible name at all.
   */
  titleId?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  dark = false,
  titleId,
}: SectionHeadingProps) {
  return (
    <FadeIn
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h2
        id={titleId}
        className={cn(
          "heading-lg",
          dark ? "text-white" : "text-foreground",
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-3 text-base leading-relaxed sm:text-[1.05rem]",
            dark ? "text-white/70" : "text-muted-foreground",
          )}
        >
          {description}
        </p>
      )}
    </FadeIn>
  );
}
