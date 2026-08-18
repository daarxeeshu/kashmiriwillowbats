import Link from "next/link";
import { announcements } from "@/data/site-config";

export function AnnouncementBar() {
  if (announcements.length === 0) return null;

  return (
    <div
      className="relative z-50 border-b border-border bg-surface-elevated"
      role="region"
      aria-label="Store announcements"
    >
      <div className="container-main flex h-[var(--announcement-height)] items-center justify-center">
        <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-[11px] font-medium text-muted-foreground">
          {announcements.map((item, index) => (
            <span key={item.id} className="inline-flex items-center gap-3">
              {index > 0 && (
                <span aria-hidden="true" className="hidden text-border-strong sm:inline">
                  •
                </span>
              )}
              {item.href ? (
                <Link
                  href={item.href}
                  className="transition-colors hover:text-foreground"
                >
                  {item.message}
                </Link>
              ) : (
                <span>{item.message}</span>
              )}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}
