import { Container, EmptyState, Screen } from '@gmrlog/ui';

/** Modal group shell — no product modals in D3.1. */
export default function ModalsIndexRoute() {
  return (
    <Screen>
      <Container>
        <EmptyState title="Modal shell" description="Modal routes mount here in later sprints." />
      </Container>
    </Screen>
  );
}
