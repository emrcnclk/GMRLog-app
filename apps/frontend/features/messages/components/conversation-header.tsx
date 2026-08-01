import type { ConversationResponse } from '@gmrlog/types';

import { ScreenHeader } from '../../../src/navigation/screen-header';
import { conversationTitle } from '../hooks/messaging-model';

export interface ConversationHeaderProps {
  conversation: ConversationResponse | null;
  selfId: string | null | undefined;
  titleFallback?: string;
  onBack: () => void;
}

export function ConversationHeader({
  conversation,
  selfId,
  titleFallback = 'Conversation',
  onBack,
}: ConversationHeaderProps) {
  const title = conversation ? conversationTitle(conversation, selfId) : titleFallback;

  return <ScreenHeader title={title} titleRole="title" onBack={onBack} backLabel="Back to inbox" />;
}
