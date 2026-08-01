import type { FeedItemResponse } from '@gmrlog/types';
import { useRouter } from 'expo-router';
import { memo, useMemo } from 'react';

import { TimelineCard } from '../../../../shared/timeline/timeline-card';
import {
  feedItemToTimelineCard,
  timelineObjectRoute,
} from '../../../../shared/timeline/timeline-model';

export interface GameActivityRowProps {
  item: FeedItemResponse;
  onPressGame: (gameId: string) => void;
  onPressUser: (userId: string) => void;
}

/**
 * Game Hub activity tab row. A thin adapter over the shared TimelineCard — the
 * hub deliberately owns no card markup of its own.
 */
function GameActivityRowComponent({ item, onPressUser }: GameActivityRowProps) {
  const router = useRouter();
  const model = useMemo(() => feedItemToTimelineCard(item), [item]);
  const route = timelineObjectRoute(model.objectRef);

  return (
    <TimelineCard
      model={model}
      onPress={
        route === null
          ? undefined
          : () => {
              router.push(route);
            }
      }
      onPressActor={onPressUser}
    />
  );
}

export const GameActivityRow = memo(GameActivityRowComponent);
