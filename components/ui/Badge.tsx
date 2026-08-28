import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "accent" | "forest";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        /* 12px, up from 10px — the same readability floor applied everywhere else.
           A chip is short, but it is still read, and the narrowest place one lands
           is a product card at 2-up on a 320px phone: 138px wide, with "Flagship"
           measuring 65px at this size against a 32px wishlist button at the other
           end, which leaves 25px between them. */
        "inline-flex items-center rounded-sm px-2 py-0.5 text-[12px] font-semibold tracking-wide",
        variant === "default" &&
          "bg-surface-elevated text-muted-foreground border border-border",
        variant === "accent" &&
          "bg-accent-muted text-accent border border-accent/20",
        variant === "forest" &&
          "bg-forest-muted text-forest-light border border-forest-light/20",
        className,
      )}
    >
      {children}
    </span>
  );
}
