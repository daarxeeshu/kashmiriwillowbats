import { Hero } from "@/components/home/Hero";
import { BrandShowcase } from "@/components/home/BrandShowcase";
import { CategoryCarousel } from "@/components/home/CategoryCarousel";
import { KISFeatured } from "@/components/home/KISFeatured";
import { ProductGrid } from "@/components/home/ProductGrid";
import { BatExpert } from "@/components/home/BatExpert";
import { EngravingSection } from "@/components/home/EngravingSection";
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
      <BatExpert />
      <EngravingSection />
      <BenefitsBar />
      <TrustSection />
      <VideoReviews />
      <OffersSection />
      <BrandStory />
    </>
  );
}
