"use client";

import { useEffect, useState } from "react";
import AccordionGallery from "@/components/AccordionGallery/AccordionGallery";
import { brandGalleryItems } from "@/data/brand-gallery";

export function BrandAccordionGallery() {
  const [orientation, setOrientation] = useState<"horizontal" | "vertical">(
    "horizontal",
  );
  const [defaultIndex, setDefaultIndex] = useState(0);

  useEffect(() => {
    const mobileMq = window.matchMedia("(max-width: 768px)");
    const coarseMq = window.matchMedia("(pointer: coarse)");

    const update = () => {
      const isMobile = mobileMq.matches;
      setOrientation(isMobile ? "vertical" : "horizontal");
      setDefaultIndex(isMobile ? 0 : 0);
    };

    update();
    mobileMq.addEventListener("change", update);
    coarseMq.addEventListener("change", update);
    return () => {
      mobileMq.removeEventListener("change", update);
      coarseMq.removeEventListener("change", update);
    };
  }, []);

  return (
    <AccordionGallery
      items={brandGalleryItems}
      defaultIndex={defaultIndex}
      accentColor="#9a7b4f"
      overlayColor="#1c1b19"
      textColor="#f7f5f2"
      height={430}
      gap={8}
      radius={18}
      expandRatio={0.48}
      orientation={orientation}
      duration={0.65}
      ease="power3.out"
      parallax={0.45}
      tilt={4}
      stagger={0.05}
      trigger={orientation === "vertical" ? "click" : "hover"}
      showLabels
      grayscale
      className="brand-accordion-gallery"
    />
  );
}
