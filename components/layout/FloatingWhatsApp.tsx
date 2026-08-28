"use client";

import { MessageCircle } from "lucide-react";
import GlassSurface from "@/components/GlassSurface";
import { buildWhatsAppUrl, whatsappMessages } from "@/lib/whatsapp";

export function FloatingWhatsApp() {
  return (
    // `site-fab` is a styling hook, not a utility, for the same reason
    // `site-announcement` is one: globals.css needs to yield this corner to the
    // mobile hero's bottom-anchored CTAs while the stage still owns the screen.
    <div className="site-fab fixed bottom-5 right-5 z-40 md:bottom-7 md:right-7">
      <GlassSurface
        borderRadius={999}
        opacity={0.94}
        brightness={100}
        displace={0}
        className="border-accent/20 shadow-[0_4px_24px_rgba(0,0,0,0.45)]"
      >
        <a
          href={buildWhatsAppUrl(whatsappMessages.batExpert)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold text-foreground transition-colors hover:text-expert"
          aria-label="WhatsApp a bat expert"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-expert-muted">
            <MessageCircle className="h-4 w-4" />
          </span>
          <span className="hidden sm:inline">Bat Expert</span>
        </a>
      </GlassSurface>
    </div>
  );
}
