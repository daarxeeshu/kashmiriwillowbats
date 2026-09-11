import type { OrderStatus } from "@/types/cart";
import { cn } from "@/lib/utils";

/* The wording here is the whole point of the feature, so it is defined once and read
 * by both the list and the detail page rather than typed out twice and drifting.
 *
 * "Opened WhatsApp" rather than "contacted": tapping through opens WhatsApp with the
 * message ready, and whether it was actually sent happens inside an app this site
 * cannot observe. Only "Confirmed" means the shop has it, and only a person can set
 * that, from the inbox. */
const LABELS: Record<OrderStatus, { text: string; className: string }> = {
  new: {
    text: "Never opened WhatsApp",
    className: "border-amber-500/40 bg-amber-500/10 text-amber-500",
  },
  whatsapp_opened: {
    text: "Opened WhatsApp",
    className: "border-sky-500/40 bg-sky-500/10 text-sky-400",
  },
  confirmed: {
    text: "Confirmed",
    className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { text, className } = LABELS[status];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        className,
      )}
    >
      {text}
    </span>
  );
}

/** Fixed locale and timezone. The server renders this and the shop reads it, and a
 *  date that formats differently depending on which machine rendered it is a date you
 *  cannot quote back to a customer with confidence. */
export function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}
