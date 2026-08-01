import type { EventParticipationStateValue, EventResponse, EventKindValue } from '@gmrlog/types';

export type EventsListStatus = 'loading' | 'error' | 'empty' | 'ready';

export interface EventsListViewModel {
  status: EventsListStatus;
  items: EventResponse[];
  error: unknown;
  isRefreshing: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
}

export function resolveEventsView(input: {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  items: EventResponse[];
  isRefreshing: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
}): EventsListViewModel {
  if (input.isPending && input.items.length === 0) {
    return {
      status: 'loading',
      items: [],
      error: null,
      isRefreshing: false,
      isFetchingNextPage: false,
      hasNextPage: false,
    };
  }
  if (input.isError && input.items.length === 0) {
    return {
      status: 'error',
      items: [],
      error: input.error,
      isRefreshing: input.isRefreshing,
      isFetchingNextPage: false,
      hasNextPage: false,
    };
  }
  if (input.items.length === 0) {
    return {
      status: 'empty',
      items: [],
      error: null,
      isRefreshing: input.isRefreshing,
      isFetchingNextPage: false,
      hasNextPage: false,
    };
  }
  return {
    status: 'ready',
    items: input.items,
    error: input.error,
    isRefreshing: input.isRefreshing,
    isFetchingNextPage: input.isFetchingNextPage,
    hasNextPage: input.hasNextPage,
  };
}

export const RSVP_STATES: readonly EventParticipationStateValue[] = [
  'looking_for_team',
  'need_players',
  'hosting',
  'going',
  'interested',
] as const;

export function viewerRsvpState(event: EventResponse): EventParticipationStateValue | null {
  return event.viewerParticipation?.state ?? null;
}

export function isViewerGoing(event: EventResponse): boolean {
  return event.viewerParticipation?.state === 'going';
}

export function rsvpStateLabel(state: EventParticipationStateValue): string {
  return state.replace(/_/g, ' ');
}

export function eventKindLabel(kind: EventKindValue): string {
  return kind.replace(/_/g, ' ');
}

export function formatEventStartsAt(iso: string, nowMs = Date.now()): string {
  const starts = Date.parse(iso);
  if (Number.isNaN(starts)) {
    return '';
  }
  const dayMs = 24 * 60 * 60 * 1000;
  const startDay = new Date(starts);
  const now = new Date(nowMs);
  const startDate = Date.UTC(
    startDay.getUTCFullYear(),
    startDay.getUTCMonth(),
    startDay.getUTCDate(),
  );
  const nowDate = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const diffDays = Math.round((startDate - nowDate) / dayMs);
  if (diffDays === 0) {
    return 'Starts today';
  }
  if (diffDays === 1) {
    return 'Starts tomorrow';
  }
  if (diffDays > 1 && diffDays < 7) {
    return `Starts in ${String(diffDays)} days`;
  }
  return startDay.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatEventWindow(startsAt: string, endsAt: string | null): string {
  const start = formatEventStartsAt(startsAt);
  if (!endsAt) {
    return start;
  }
  const end = new Date(endsAt);
  if (Number.isNaN(end.getTime())) {
    return start;
  }
  return `${start} · ends ${end.toLocaleDateString()}`;
}

export function optimisticRsvp(
  event: EventResponse,
  state: EventParticipationStateValue,
): EventResponse {
  return {
    ...event,
    viewerParticipation: {
      state,
      createdAt: new Date().toISOString(),
    },
  };
}

export function optimisticJoin(event: EventResponse): EventResponse {
  return optimisticRsvp(event, 'going');
}

export function optimisticLeave(event: EventResponse): EventResponse {
  return {
    ...event,
    viewerParticipation: null,
  };
}

/** Patch event inside discover infinite pages when present. */
export function patchEventInDiscoverPages<T extends { data: EventResponse[] }>(
  pages: T[] | undefined,
  event: EventResponse,
): T[] | undefined {
  if (!pages) {
    return pages;
  }
  return pages.map((page) => ({
    ...page,
    data: page.data.map((item) => (item.id === event.id ? event : item)),
  }));
}
