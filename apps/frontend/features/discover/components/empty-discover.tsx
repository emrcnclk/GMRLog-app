import { Button, EmptyState } from '@gmrlog/ui';
import { useRouter } from 'expo-router';

export interface EmptyDiscoverProps {
  title: string;
  description: string;
  /** Offer a way into the catalog. Off for surfaces that *are* the catalog. */
  showBrowseAction?: boolean;
}

/**
 * Calm empty Discover surface — no FOMO.
 *
 * The medallion and centring now come from the `EmptyState` primitive rather
 * than being re-assembled here, which also removes the decorative view that
 * used to announce "Discover illustration placeholder" to screen readers
 * before the actual message (PRODUCT_POLISH_AUDIT F7).
 */
export function EmptyDiscover({ title, description, showBrowseAction }: EmptyDiscoverProps) {
  const router = useRouter();

  return (
    <EmptyState
      icon="compass"
      title={title}
      description={description}
      fill
      action={
        showBrowseAction === true ? (
          <Button
            accessibilityLabel="Browse all games"
            onPress={() => {
              router.push('/(app)/(tabs)/discover/games');
            }}
          >
            Browse all games
          </Button>
        ) : undefined
      }
    />
  );
}
