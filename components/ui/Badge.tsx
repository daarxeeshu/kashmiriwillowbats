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
        "inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-semibold tracking-wide",
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
