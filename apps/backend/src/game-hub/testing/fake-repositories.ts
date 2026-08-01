import type {
  Collection,
  CollectionRepository,
  TierList,
  TierListRepository,
} from '@gmrlog/database';

export { makeCollection } from '../../collections/testing/fake-repositories';
export { makeTierList } from '../../tierlists/testing/fake-repositories';

/**
 * In-memory fakes — test support only (build-excluded).
 * The domain `listPublicContainingGame` fakes in `collections/testing` and
 * `tierlists/testing` always resolve `[]` (no entries/slots join seed). Game
 * Hub tests seed the already-filtered "contains this game" result directly.
 */

export interface FakeGameHubCollectionRepository extends Pick<
  CollectionRepository,
  'listPublicContainingGame'
> {
  rows: Collection[];
}

export function createFakeGameHubCollectionRepository(
  seed: Collection[] = [],
): FakeGameHubCollectionRepository {
  return {
    rows: seed,
    listPublicContainingGame: () =>
      Promise.resolve(seed.filter((row) => row.visibility === 'public' && row.deletedAt == null)),
  };
}

export interface FakeGameHubTierListRepository extends Pick<
  TierListRepository,
  'listPublicContainingGame'
> {
  rows: TierList[];
}

export function createFakeGameHubTierListRepository(
  seed: TierList[] = [],
): FakeGameHubTierListRepository {
  return {
    rows: seed,
    listPublicContainingGame: () =>
      Promise.resolve(seed.filter((row) => row.visibility === 'public' && row.deletedAt == null)),
  };
}
