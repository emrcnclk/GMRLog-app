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

/**
 * §21's filter pills. `GET /discover/events` takes no `kind` query param
 * (only `cursor`/`limit`), so this filters the already-loaded page client-side
 * rather than re-querying — the same limitation 3b.1 hit on Circles before its
 * kind filter grew a real server param in 3b.1e. Recorded as a backend
 * follow-up rather than silently accepted: a `kind` param on `/discover/events`
 * would let this filter cover every page, not just what's been fetched.
 */
export type EventFilterValue = 'all' | 'tournaments' | 'watch_parties' | 'launches';

export const EVENT_FILTERS: readonly {
  value: EventFilterValue;
  label: string;
  kinds: readonly EventKindValue[] | null;
}[] = [
  { value: 'all', label: 'All', kinds: null },
  { value: 'tournaments', label: 'Tournaments', kinds: ['tournament'] },
  { value: 'watch_parties', label: 'Watch parties', kinds: ['watch_party'] },
  { value: 'launches', label: 'Launches', kinds: ['release_countdown', 'release'] },
];

export function filterEventsByKind(
  events: EventResponse[],
  filter: EventFilterValue,
): EventResponse[] {
  const entry = EVENT_FILTERS.find((f) => f.value === filter);
  if (!entry?.kinds) {
    return events;
  }
  const kinds = entry.kinds;
  return events.filter((event) => kinds.includes(event.kind));
}

/**
 * §21's "This week" / "Later" kickers. No grouping field exists server-side
 * (`EventResponse` carries only `startsAt`/`endsAt`), so this buckets by the
 * same day-diff arithmetic `formatEventStartsAt` already uses — a pure
 * function of a real timestamp, not an invented field.
 */
export interface GroupedEvents {
  thisWeek: EventResponse[];
  later: EventResponse[];
}

export function groupEventsByWhen(events: EventResponse[], nowMs = Date.now()): GroupedEvents {
  const dayMs = 24 * 60 * 60 * 1000;
  const now = new Date(nowMs);
  const nowDate = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  const thisWeek: EventResponse[] = [];
  const later: EventResponse[] = [];

  for (const event of events) {
    const starts = Date.parse(event.startsAt);
    if (Number.isNaN(starts)) {
      later.push(event);
      continue;
    }
    const startDay = new Date(starts);
    const startDate = Date.UTC(
      startDay.getUTCFullYear(),
      startDay.getUTCMonth(),
      startDay.getUTCDate(),
    );
    const diffDays = Math.round((startDate - nowDate) / dayMs);
    if (diffDays < 7) {
      thisWeek.push(event);
    } else {
      later.push(event);
    }
  }

  return { thisWeek, later };
}

/**
 * §21's "pulsing accent dot" plate replacement. Derived purely from the
 * event's own real `startsAt`/`endsAt` window — not a fabricated flag, but
 * also not a guess: without an `endsAt`, there is no real signal the event has
 * *not* ended, so an event with no end time never reads as live.
 */
export function isEventLive(event: EventResponse, nowMs = Date.now()): boolean {
  if (!event.endsAt) {
    return false;
  }
  const starts = Date.parse(event.startsAt);
  const ends = Date.parse(event.endsAt);
  if (Number.isNaN(starts) || Number.isNaN(ends)) {
    return false;
  }
  return nowMs >= starts && nowMs <= ends;
}

const PLATE_MONTH_FORMATTER = new Intl.DateTimeFormat(undefined, { month: 'short' });

/** Date-plate day figure — "20" from a real `startsAt`. */
export function eventDatePlateDay(startsAt: string): string {
  const starts = Date.parse(startsAt);
  if (Number.isNaN(starts)) {
    return '';
  }
  return String(new Date(starts).getDate());
}

/** Date-plate month figure — "AUG" from a real `startsAt`, monospace-uppercase per §21. */
export function eventDatePlateMonth(startsAt: string): string {
  const starts = Date.parse(startsAt);
  if (Number.isNaN(starts)) {
    return '';
  }
  return PLATE_MONTH_FORMATTER.format(new Date(starts)).toUpperCase();
}

/** The row's monospace "time" figure — §21's line drops to time-only; see event-card.tsx for why. */
export function eventRowTime(startsAt: string): string {
  const starts = Date.parse(startsAt);
  if (Number.isNaN(starts)) {
    return '';
  }
  return new Date(starts).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
