import { EmptyState } from '@gmrlog/ui';

export interface EmptyEventsProps {
  title?: string;
  description?: string;
}

export function EmptyEvents({
  title = 'No events yet',
  description = 'Shared events will appear here when published. Pull to refresh.',
}: EmptyEventsProps) {
  return <EmptyState title={title} description={description} />;
}
