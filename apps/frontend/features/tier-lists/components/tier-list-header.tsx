import type { TierListResponse } from '@gmrlog/types';
import { Badge } from '@gmrlog/ui';

import { ScreenHeader } from '../../../src/navigation/screen-header';
import { countTierListGames, formatUpdatedAt, visibilityLabel } from '../hooks/tier-list-model';

export interface TierListHeaderProps {
  tierList: TierListResponse;
  onBack: () => void;
}

export function TierListHeader({ tierList, onBack }: TierListHeaderProps) {
  const gameCount = countTierListGames(tierList);

  return (
    <ScreenHeader
      title={tierList.title}
      titleRole="title"
      subtitle={`${String(gameCount)} games · Updated ${formatUpdatedAt(tierList.updatedAt)}`}
      onBack={onBack}
      trailing={<Badge tone="neutral">{visibilityLabel(tierList.visibility)}</Badge>}
    />
  );
}
