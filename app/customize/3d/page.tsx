import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { Container } from "@/components/ui/Container";
import { BatStudioSection } from "@/components/configurator/BatStudioSection";

export const metadata: Metadata = {
  title: "Customise Your Bat 3D",
  description:
    "Shape a Kashmir or English willow bat in 3D — profile, edge, toe, handle and grip — and see your name laser-engraved into the willow as you type it.",
};

/* A route rather than a block on `/customize`.
 *
 * `/customize` is the marketing page for engraving as a service, and it is short,
 * static and cheap. The studio is a WebGL canvas that loads about 2.4 MB of model and
 * texture, and folding it into that page would make the engraving explainer expensive
 * for every visitor who only wanted to read the price. So the two are linked in both
 * directions and neither pays for the other. */
export default function CustomiseBat3DPage() {
  return (
    <Container className="section-padding">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Customize", href: "/customize" },
          { label: "Customise Your Bat 3D" },
        ]}
      />

      <div className="mt-6">
        <BatStudioSection />
      </div>

      <p className="mt-10 text-xs leading-relaxed text-muted-foreground">
        Looking for engraving on a bat you have already chosen? Every bat can be
        configured and engraved from{" "}
        <Link
          href="/customize"
          className="text-accent underline-offset-2 hover:underline"
        >
          its own product page
        </Link>
        , and the workshop receives the same spec either way.
      </p>
    </Container>
  );
}
