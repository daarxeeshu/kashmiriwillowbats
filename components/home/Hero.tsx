"use client";

// The home page's hero. Kept as a named `Hero` export at this path so app/page.tsx
// and any other caller stay untouched; everything that makes it work lives in
// components/hero/.
export { HeroSequence as Hero } from "@/components/hero/HeroSequence";
