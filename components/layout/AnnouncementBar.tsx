import Link from "next/link";
import { announcements } from "@/data/site-config";
import { cn } from "@/lib/utils";

export function AnnouncementBar() {
  if (announcements.length === 0) return null;

  return (
    <div
      // `site-announcement` is a styling hook, not a utility: globals.css uses it
      // to strip this bar's surface while the home page's hero sequence is
      // running, since the hero is pulled up underneath it.
      className="site-announcement relative z-50 border-b border-border bg-surface-elevated transition-opacity duration-500"
      role="region"
      aria-label="Store announcements"
    >
      {/* min-height, not height: the announcements wrap on narrow viewports
          (flex-wrap + gap-y-1), and a fixed height would clip the second line.
          The token still sets the resting height so the bar cannot collapse. */}
      <div className="container-main flex min-h-[var(--announcement-height)] items-center justify-center py-1">
        {/* 12px, not 11px. These are three full sentences of running copy and each
            one is a link, so this is body text by any reading of the term — the
            smallest genuine prose on the page, sitting at the very top of it, in
            muted-foreground on a dark bar. Size is the part of that worth fixing. */}
        <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-[12px] font-medium text-muted-foreground">
          {announcements.map((item, index) => (
            <span
              key={item.id}
              className={cn(
                "items-center gap-3",
                /* Three sentences of 12px copy measure about 460px. A 375px phone
                   offers a 343px line, so all three can only ever wrap to a ragged
                   two: the first pair filling the line edge to edge with no
                   breathing room, the third orphaned and centred beneath it, and
                   the bar swelling from its 36px token to 49px. Below `sm` the bar
                   therefore carries one announcement at its designed height. From
                   `sm` up the whole row fits on one line — 608px of measure against
                   roughly 530px of content — so the original centred layout, and
                   every viewport that was already correct, is untouched. */
                index === 0 ? "inline-flex" : "hidden sm:inline-flex",
              )}
            >
              {index > 0 && (
                <span aria-hidden="true" className="hidden text-border-strong sm:inline">
                  •
                </span>
              )}
              {item.href ? (
                <Link
                  href={item.href}
                  /* The 12px line box is 18px tall, which is under the 24px floor
                     WCAG 2.2 sets for a target that is not inline in a sentence —
                     and these are three standalone links in a bar, not prose. The
                     padding takes each to 26px. It costs the bar nothing: 26px plus
                     the container's own 8px still sits inside the 36px min-height,
                     so nothing moves at any width. */
                  className="py-1 transition-colors hover:text-foreground"
                >
                  {item.message}
                </Link>
              ) : (
                <span className="py-1">{item.message}</span>
              )}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}
