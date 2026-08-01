import { describe, expect, it } from 'vitest';

import { completeProviderMetadata, FakeMetadataProvider } from '../testing/fake-providers';

import { MetadataProviderRegistry } from './metadata-provider.registry';
import { emptyProviderMetadata, type GameMetadataProvider } from './metadata-provider.port';

const QUERY = { title: 'Hades', slug: 'hades' };
const MIN_CONFIDENCE = 0.55;

function registry(...providers: GameMetadataProvider[]): MetadataProviderRegistry {
  return new MetadataProviderRegistry(providers, null);
}

function steamResult(
  overrides: Partial<ReturnType<typeof emptyProviderMetadata>> = {},
): ReturnType<typeof emptyProviderMetadata> {
  return { ...emptyProviderMetadata('steam', 'Steam'), confidence: 1, ...overrides };
}

describe('MetadataProviderRegistry.enabledProviders', () => {
  it('returns providers in priority order, lowest first', () => {
    const chain = registry(
      new FakeMetadataProvider({ name: 'rawg', priority: 30 }),
      new FakeMetadataProvider({ name: 'igdb', priority: 10 }),
      new FakeMetadataProvider({ name: 'steam', priority: 20 }),
    );

    expect(chain.enabledProviders().map((provider) => provider.name)).toEqual([
      'igdb',
      'steam',
      'rawg',
    ]);
  });

  it('excludes disabled providers', () => {
    const chain = registry(
      new FakeMetadataProvider({ name: 'igdb', enabled: false }),
      new FakeMetadataProvider({ name: 'steam', priority: 20 }),
    );

    expect(chain.enabledProviders().map((provider) => provider.name)).toEqual(['steam']);
  });
});

describe('MetadataProviderRegistry.resolve', () => {
  it('reports the zero-credential configuration distinctly from a no-match', async () => {
    const chain = registry(new FakeMetadataProvider({ enabled: false }));

    const resolution = await chain.resolve(QUERY, MIN_CONFIDENCE);

    expect(resolution.noProvidersEnabled).toBe(true);
    expect(resolution.metadata).toBeNull();
    expect(resolution.errors).toEqual([]);
  });

  it('returns a null result with noProvidersEnabled=false when nothing matched', async () => {
    const chain = registry(new FakeMetadataProvider({ result: null }));

    const resolution = await chain.resolve(QUERY, MIN_CONFIDENCE);

    expect(resolution.noProvidersEnabled).toBe(false);
    expect(resolution.metadata).toBeNull();
  });

  it('makes the first provider above the floor the primary', async () => {
    const chain = registry(
      new FakeMetadataProvider({ name: 'igdb', priority: 10, result: completeProviderMetadata() }),
      new FakeMetadataProvider({ name: 'steam', priority: 20, result: steamResult() }),
    );

    const resolution = await chain.resolve(QUERY, MIN_CONFIDENCE);

    expect(resolution.metadata?.provider).toBe('igdb');
  });

  it('rejects results below the confidence floor', async () => {
    const chain = registry(
      new FakeMetadataProvider({ result: completeProviderMetadata({ confidence: 0.3 }) }),
    );

    const resolution = await chain.resolve(QUERY, MIN_CONFIDENCE);

    expect(resolution.metadata).toBeNull();
  });

  it('lets a lower-priority provider become primary when the first is below the floor', async () => {
    const chain = registry(
      new FakeMetadataProvider({
        name: 'igdb',
        priority: 10,
        result: completeProviderMetadata({ confidence: 0.2 }),
      }),
      new FakeMetadataProvider({ name: 'steam', priority: 20, result: steamResult() }),
    );

    const resolution = await chain.resolve(QUERY, MIN_CONFIDENCE);

    expect(resolution.metadata?.provider).toBe('steam');
  });

  it('fills primary gaps from a secondary without overwriting', async () => {
    const chain = registry(
      new FakeMetadataProvider({
        name: 'igdb',
        priority: 10,
        result: completeProviderMetadata({ summary: null, description: 'igdb description' }),
      }),
      new FakeMetadataProvider({
        name: 'steam',
        priority: 20,
        result: steamResult({ summary: 'steam summary', description: 'steam description' }),
      }),
    );

    const resolution = await chain.resolve(QUERY, MIN_CONFIDENCE);

    expect(resolution.metadata?.summary).toBe('steam summary');
    expect(resolution.metadata?.description).toBe('igdb description');
  });

  it('threads external ids forward so a later provider can use them', async () => {
    const steam = new FakeMetadataProvider({
      name: 'steam',
      priority: 20,
      result: steamResult(),
    });
    const chain = registry(
      new FakeMetadataProvider({
        name: 'igdb',
        priority: 10,
        result: completeProviderMetadata({ externalIds: { igdbId: 1905, steamAppId: 1145360 } }),
      }),
      steam,
    );

    await chain.resolve(QUERY, MIN_CONFIDENCE);

    // Steam cannot search by title; it only runs because IGDB supplied the appid.
    expect(steam.calls[0]?.steamAppId).toBe(1145360);
  });

  it('records a throwing provider and continues down the chain', async () => {
    const chain = registry(
      new FakeMetadataProvider({
        name: 'igdb',
        priority: 10,
        error: new Error('IGDB HTTP 500'),
      }),
      new FakeMetadataProvider({ name: 'steam', priority: 20, result: steamResult() }),
    );

    const resolution = await chain.resolve(QUERY, MIN_CONFIDENCE);

    expect(resolution.errors).toEqual([{ provider: 'igdb', message: 'IGDB HTTP 500' }]);
    expect(resolution.metadata?.provider).toBe('steam');
  });

  it('surfaces errors when every provider throws', async () => {
    const chain = registry(
      new FakeMetadataProvider({ name: 'igdb', priority: 10, error: new Error('a') }),
      new FakeMetadataProvider({ name: 'steam', priority: 20, error: new Error('b') }),
    );

    const resolution = await chain.resolve(QUERY, MIN_CONFIDENCE);

    expect(resolution.metadata).toBeNull();
    expect(resolution.errors).toHaveLength(2);
    expect(resolution.noProvidersEnabled).toBe(false);
  });

  it('never calls a disabled provider', async () => {
    const disabled = new FakeMetadataProvider({ name: 'rawg', priority: 30, enabled: false });
    const chain = registry(
      new FakeMetadataProvider({ name: 'igdb', priority: 10, result: completeProviderMetadata() }),
      disabled,
    );

    await chain.resolve(QUERY, MIN_CONFIDENCE);

    expect(disabled.calls).toHaveLength(0);
  });
});
