import { Hero } from "@/components/home/Hero";
import { BrandShowcase } from "@/components/home/BrandShowcase";
import { CategoryCarousel } from "@/components/home/CategoryCarousel";
import { KISFeatured } from "@/components/home/KISFeatured";
import { ProductGrid } from "@/components/home/ProductGrid";
import { CustomiseBatCard } from "@/components/home/CustomiseBatCard";
import { BatExpert } from "@/components/home/BatExpert";
import { EngravingSection } from "@/components/home/EngravingSection";
import { HardTennisBats } from "@/components/home/HardTennisBats";
import { BatDoctorBand } from "@/components/home/BatDoctorBand";
import { BenefitsBar, TrustSection } from "@/components/home/TrustSection";
import { VideoReviews } from "@/components/home/VideoReviews";
import { OffersSection } from "@/components/home/OffersSection";
import { WallOfFame } from "@/components/home/WallOfFame";
import { BrandStory } from "@/components/home/BrandStory";

export default function HomePage() {
  return (
    <>
      <Hero />
      <BrandShowcase />
      <CategoryCarousel />
      <KISFeatured />
      <ProductGrid />
      {/* The made-to-order range. It sits with the product sections rather than with
          the services below, because it sells three bats — what is unusual about it
          is that they are specified rather than picked off a shelf. */}
      <CustomiseBatCard />
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
      {/* Social proof, so it sits with the other evidence rather than interrupting
          the product run higher up the page. */}
      <WallOfFame />
      <BrandStory />
    </>
  );
}
