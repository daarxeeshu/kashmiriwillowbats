import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "expert"
  | "outline"
  | "outline-dark";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-forest text-white hover:bg-forest-hover border border-forest shadow-sm",
  secondary:
    "bg-surface text-foreground border border-border-strong hover:border-foreground/25 hover:bg-surface-elevated",
  ghost: "bg-transparent text-foreground hover:bg-foreground/5 border border-transparent",
  expert:
    "bg-expert-muted text-expert border border-expert/30 hover:bg-expert/15 hover:border-expert/50",
  outline:
    "bg-transparent text-foreground border border-border-strong hover:border-foreground/30 hover:bg-surface-elevated",
  "outline-dark":
    "bg-transparent text-white border border-white/30 hover:bg-white/10",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-xs font-semibold",
  md: "h-11 px-5 text-sm font-semibold",
  lg: "h-12 px-7 text-sm font-semibold tracking-wide",
};

const baseStyles =
  "inline-flex items-center justify-center gap-2 rounded-sm font-medium transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest";

/** The skin a `Button`/`ButtonLink` would wear, without the element.
 *
 *  It exists for one case: an element that must not be a `<button>` or a plain `<a>`
 *  but should be indistinguishable from one. `next/link` is that case — `ButtonLink`
 *  renders a bare `<a>`, which is right for an external URL and wrong for an internal
 *  route, where it would cost client-side navigation and prefetch.
 *
 *  Before this existed the alternative was copying the strings by hand, and the
 *  header is the evidence for why that does not hold: the Bat Doctor link carried a
 *  comment claiming it reproduced `variant="expert"` while actually using `accent`
 *  tokens, so the two buttons sitting side by side in the same bar were a visibly
 *  different gold. A caller that asks for `expert` now gets `expert`. */
export function buttonClass({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(baseStyles, variantStyles[variant], sizeStyles[size], className);
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          "disabled:pointer-events-none disabled:opacity-50",
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export interface ButtonLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function ButtonLink({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonLinkProps) {
  return (
    <a className={buttonClass({ variant, size, className })} {...props} />
  );
}
