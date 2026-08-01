import type { ContentVisibilityValue } from '@gmrlog/types';
import { Badge } from '@gmrlog/ui';

import { visibilityLabel } from '../hooks/community-model';

export interface VisibilityBadgeProps {
  visibility: ContentVisibilityValue;
}

export function VisibilityBadge({ visibility }: VisibilityBadgeProps) {
  return <Badge tone="neutral">{visibilityLabel(visibility)}</Badge>;
}
