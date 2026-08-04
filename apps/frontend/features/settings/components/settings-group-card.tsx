import { Card, Divider } from '@gmrlog/ui';
import { Children, Fragment, isValidElement, memo, type ReactNode } from 'react';

export interface SettingsGroupCardProps {
  children: ReactNode;
}

/**
 * The grouped-card container (SCREEN_REDESIGNS.md §9): a `radius.lg` card
 * holding rows with hairlines *between* them and none at the outer edge.
 * `Card`'s own border already draws that outer edge, so the padding is
 * dropped to zero and left to each `SettingsRow`.
 */
function SettingsGroupCardComponent({ children }: SettingsGroupCardProps) {
  const rows = Children.toArray(children).filter(isValidElement);

  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      {rows.map((row, index) => (
        <Fragment key={row.key ?? index}>
          {index > 0 ? <Divider /> : null}
          {row}
        </Fragment>
      ))}
    </Card>
  );
}

export const SettingsGroupCard = memo(SettingsGroupCardComponent);
