import Link from "next/link";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("text-sm", className)}>
      <ol className="flex flex-wrap items-center gap-1.5 text-muted-foreground">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="inline-flex items-center gap-1.5">
              {index > 0 && <span aria-hidden="true">/</span>}
              {item.href && !isLast ? (
                /* 14px copy gives a 20px line box, and WCAG 2.2 sets a 24px floor
                   for anything that is not a link inline in a sentence — these are
                   standalone navigation links in a `nav`, so the prose exemption
                   does not cover them. `py-0.5` takes each to exactly 24px.

                   `-my-0.5` cancels it again for layout. Padding counts toward the
                   hit area whether or not a negative margin offsets it, so the
                   target grows while the row keeps the 20px height the desktop
                   design was built around — nothing below the breadcrumb moves at
                   any width. 2px of expansion per side also stays inside the
                   `gap-1.5` row gap, which matters because the trail does wrap:
                   Home / Kashmir Willow Bats / KIS / M&H7000+ is one row at 375px
                   and two at 320px, and the two rows' targets stay clear of each
                   other there. */
                <Link
                  href={item.href}
                  className="-my-0.5 py-0.5 transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "font-medium text-foreground" : undefined}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
