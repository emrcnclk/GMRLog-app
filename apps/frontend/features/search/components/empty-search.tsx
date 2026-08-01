import { Button, EmptyState } from '@gmrlog/ui';
import { useRouter } from 'expo-router';

export interface EmptySearchProps {
  query?: string;
}

/**
 * Two different absences, told apart.
 *
 * "I have not searched yet" and "I searched and found nothing" are not the same
 * state, and answering both with one message teaches nothing. The no-results
 * case names the failed term and offers a way onward instead of leaving the
 * reader at a dead end.
 */
export function EmptySearch({ query }: EmptySearchProps) {
  const router = useRouter();
  const hasQuery = query !== undefined && query.length > 0;

  return (
    <EmptyState
      icon={hasQuery ? 'search-x' : 'search'}
      title={hasQuery ? 'No results' : 'Search GMRLOG'}
      description={
        hasQuery
          ? `Nothing matched “${query}”. Check the spelling, or try a shorter term.`
          : 'Find games, players, reviews, collections, and communities — all from one field.'
      }
      fill
      action={
        hasQuery ? (
          <Button
            variant="secondary"
            accessibilityLabel="Browse Discover instead"
            onPress={() => {
              router.push('/(app)/(tabs)/discover');
            }}
          >
            Browse Discover
          </Button>
        ) : undefined
      }
    />
  );
}
