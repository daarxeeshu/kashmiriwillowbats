import { Hero } from "@/components/home/Hero";
import { BrandShowcase } from "@/components/home/BrandShowcase";
import { CategoryCarousel } from "@/components/home/CategoryCarousel";
import { KISFeatured } from "@/components/home/KISFeatured";
import { ProductGrid } from "@/components/home/ProductGrid";
import { BatExpert } from "@/components/home/BatExpert";
import { EngravingSection } from "@/components/home/EngravingSection";
import { HardTennisBats } from "@/components/home/HardTennisBats";
import { BatDoctorBand } from "@/components/home/BatDoctorBand";
import { BenefitsBar, TrustSection } from "@/components/home/TrustSection";
import { VideoReviews } from "@/components/home/VideoReviews";
import { OffersSection } from "@/components/home/OffersSection";
import { BrandStory } from "@/components/home/BrandStory";

export default function HomePage() {
  return (
    <>
      <Hero />
      <BrandShowcase />
      <CategoryCarousel />
      <KISFeatured />
      <ProductGrid />
      {/* Last of the product sections, before the page turns to services. It reads as
          another way to shop rather than an afterthought appended below them. */}
      <HardTennisBats />
      <BatExpert />
      <EngravingSection />
      {/* The three service bands in the order a bat is lived with: choose it,
          personalise it, repair it. */}
      <BatDoctorBand />
      <BenefitsBar />
      <TrustSection />
      <VideoReviews />
      <OffersSection />
      <BrandStory />
    </>
  );
}
