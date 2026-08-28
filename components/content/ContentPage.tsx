import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { Container } from "@/components/ui/Container";

/* One frame for the information and policy pages, so twelve routes share a measure, a
 * heading scale and a breadcrumb instead of drifting into twelve slightly different
 * pages. Content pages differ in what they say, not in how they are built.
 *
 * The measure is capped at `3xl` on the prose: a policy set to the full container
 * width runs to well over 100 characters a line on a desktop, which is roughly double
 * what is comfortable to read — and these are the pages most likely to be read
 * properly rather than skimmed. */

interface ContentPageProps {
  title: string;
  /** One or two sentences under the heading. */
  intro?: ReactNode;
  /** Trail after Home. The current page is appended from `title`. */
  trail?: { label: string; href: string }[];
  children: ReactNode;
}

export function ContentPage({ title, intro, trail = [], children }: ContentPageProps) {
  return (
    <Container className="section-padding">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, ...trail, { label: title }]}
      />

      <div className="mt-6 max-w-3xl">
        <h1 className="heading-lg">{title}</h1>
        {intro && (
          <div className="mt-4 text-base leading-relaxed text-muted-foreground">
            {intro}
          </div>
        )}
      </div>

      <div className="mt-10 max-w-3xl">{children}</div>
    </Container>
  );
}

/** A titled block. `id` so a policy section can be linked to directly. */
export function Section({
  title,
  id,
  children,
}: {
  title: string;
  id?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mt-10 first:mt-0 scroll-mt-24">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

/** Numbered process steps — used by returns, warranty and refunds, which are all the
 *  same shape: contact us, give us these details, we assess, we tell you what happens. */
export function Steps({ steps }: { steps: string[] }) {
  return (
    <ol className="mt-4 space-y-3">
      {steps.map((step, index) => (
        <li key={step} className="flex gap-3 text-sm leading-relaxed">
          <span
            aria-hidden="true"
            className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-xs font-semibold text-accent"
          >
            {index + 1}
          </span>
          <span className="text-muted-foreground">{step}</span>
        </li>
      ))}
    </ol>
  );
}

/** A standing caveat — used where a page states something the business still has to
 *  confirm, or that a lawyer should see before launch. Visually quieter than a
 *  warning, because it is addressed to the business rather than the customer. */
export function Note({ children }: { children: ReactNode }) {
  return (
    <p className="mt-6 rounded-sm border border-dashed border-border bg-surface-elevated p-4 text-xs leading-relaxed text-muted">
      {children}
    </p>
  );
}
