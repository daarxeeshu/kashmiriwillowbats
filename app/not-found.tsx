import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <Container className="section-padding text-center">
      <p className="eyebrow">404</p>
      <h1 className="heading-lg mt-3">Page not found</h1>
      <p className="mx-auto mt-4 max-w-md text-muted-foreground">
        The page you are looking for does not exist or the catalogue item is not
        listed yet.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/" variant="primary" size="md">
          Back to home
        </ButtonLink>
        <ButtonLink href="/brands" variant="outline" size="md">
          Browse brands
        </ButtonLink>
      </div>
      <p className="mt-6 text-sm text-muted">
        Need help?{" "}
        <Link href="/#bat-expert" className="text-accent hover:underline">
          Contact a bat expert
        </Link>
      </p>
    </Container>
  );
}
