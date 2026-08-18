import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/catalog/PageHeader";
import { ButtonLink } from "@/components/ui/Button";

interface ComingSoonPageProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export function ComingSoonPage({
  title,
  description,
  actionLabel = "Back to shop",
  actionHref = "/",
}: ComingSoonPageProps) {
  return (
    <Container className="section-padding">
      <PageHeader title={title} description={description} />
      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href={actionHref} variant="primary" size="md">
          {actionLabel}
        </ButtonLink>
        <ButtonLink href="/categories/kashmir-willow-bats" variant="outline" size="md">
          Browse Kashmir Willow
        </ButtonLink>
      </div>
      <p className="mt-8 text-sm text-muted-foreground">
        This module will connect to the commerce backend in a future release.
      </p>
    </Container>
  );
}
