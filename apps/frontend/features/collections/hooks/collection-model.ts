import type {
  CollectionEntryResponse,
  CollectionResponse,
  ContentVisibilityValue,
} from '@gmrlog/types';
import {
  collectionCreateSchema,
  collectionEntriesPutSchema,
  collectionPatchSchema,
  contentVisibilitySchema,
} from '@gmrlog/validators';
import { z } from 'zod';

import { formatUpdatedAt, resolveListView } from '../../boards/shared/board-model';

export { formatUpdatedAt, resolveListView };

export function visibilityLabel(visibility: ContentVisibilityValue): string {
  switch (visibility) {
    case 'public':
      return 'Public';
    case 'followers':
      return 'Followers';
    case 'private':
      return 'Private';
    case 'community':
      return 'Community';
    default: {
      const _exhaustive: never = visibility;
      return _exhaustive;
    }
  }
}

export function isCollectionOwner(
  collection: CollectionResponse,
  userId: string | undefined,
): boolean {
  return userId !== undefined && collection.owner.id === userId;
}

export interface EditableCollectionEntry {
  gameId: string;
  note: string | null;
  title: string;
}

export function toEditableEntries(entries: CollectionEntryResponse[]): EditableCollectionEntry[] {
  return [...entries]
    .sort((a, b) => a.position - b.position)
    .map((entry) => ({
      gameId: entry.gameId,
      note: entry.note,
      title: entry.game?.title ?? entry.gameId,
    }));
}

export function entriesToPutPayload(entries: EditableCollectionEntry[]) {
  return collectionEntriesPutSchema.parse({
    entries: entries.map((entry) => ({
      gameId: entry.gameId,
      note: entry.note,
    })),
  });
}

export function hasDuplicateGameId(entries: EditableCollectionEntry[], gameId: string): boolean {
  return entries.some((entry) => entry.gameId === gameId);
}

export function addCollectionEntry(
  entries: EditableCollectionEntry[],
  game: { gameId: string; title: string },
): EditableCollectionEntry[] | 'duplicate' {
  if (hasDuplicateGameId(entries, game.gameId)) {
    return 'duplicate';
  }
  return [...entries, { gameId: game.gameId, note: null, title: game.title }];
}

export function removeCollectionEntry(
  entries: EditableCollectionEntry[],
  gameId: string,
): EditableCollectionEntry[] {
  return entries.filter((entry) => entry.gameId !== gameId);
}

export function moveCollectionEntry(
  entries: EditableCollectionEntry[],
  fromIndex: number,
  toIndex: number,
): EditableCollectionEntry[] {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= entries.length ||
    toIndex >= entries.length ||
    fromIndex === toIndex
  ) {
    return entries;
  }
  const next = [...entries];
  const [item] = next.splice(fromIndex, 1);
  if (!item) {
    return entries;
  }
  next.splice(toIndex, 0, item);
  return next;
}

export const collectionComposerCreateSchema = collectionCreateSchema;
export type CollectionComposerCreateValues = z.infer<typeof collectionComposerCreateSchema>;

export const collectionComposerEditSchema = z
  .object({
    title: z.string().trim().min(1).max(100),
    description: z.string().max(2_000),
    visibility: contentVisibilitySchema,
  })
  .strict();

export type CollectionComposerEditValues = z.infer<typeof collectionComposerEditSchema>;

export function toCollectionPatchPayload(values: CollectionComposerEditValues) {
  return collectionPatchSchema.parse({
    title: values.title,
    description: values.description.trim().length === 0 ? null : values.description,
    visibility: values.visibility,
  });
}
