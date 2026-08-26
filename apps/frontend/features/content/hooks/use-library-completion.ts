import type { LibraryEntryResponse, LibraryStatusValue } from '@gmrlog/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useApiClient } from '../../../src/api/api-provider';
import { queryKeys } from '../../../src/query/query-client';

/**
 * 13.1 — the viewer's own completion figure for one game.
 *
 * The first write the frontend makes to the library. Every library call before
 * this one was a read, which is why the figure needs a mutation rather than a
 * field on an existing form: there was no form.
 *
 * The shelf is passed through untouched. `PUT /library/entries/{gameId}`
 * requires a status because an entry cannot exist without one, and a caller
 * that is only changing the percent must not be able to move the game to a
 * different shelf as a side effect of saying how far they got.
 *
 * Invalidations cover the three surfaces the figure appears on: the game hub
 * that just wrote it, the library list the Platinum case is built from, and
 * the statistics behind §6's Platinum metric.
 */
export function useSetCompletionPercent(gameId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation<
    LibraryEntryResponse,
    Error,
    { status: LibraryStatusValue; completionPercent: number | null }
  >({
    mutationFn: async (input) => {
      const envelope = await api.upsertLibraryEntry(gameId, {
        status: input.status,
        completionPercent: input.completionPercent,
      });
      return envelope.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.games.detail(gameId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.library.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.statistics.all }),
      ]);
    },
  });
}
