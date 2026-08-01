import { describe, expect, it, vi } from 'vitest';

import { GamesController } from './games.controller';
import { GamesService } from './games.service';

function createController(overrides: Partial<GamesService> = {}): {
  controller: GamesController;
  service: GamesService;
} {
  const service = {
    getGame: vi.fn().mockResolvedValue({ id: 'game-1', title: 'Hollow' }),
    listMedia: vi.fn().mockResolvedValue([]),
    listSimilar: vi.fn().mockResolvedValue([]),
    getMetadataStatus: vi
      .fn()
      .mockResolvedValue({ gameId: 'game-1', metadata: { status: 'pending' } }),
    ...overrides,
  } as unknown as GamesService;
  return { controller: new GamesController(service), service };
}

describe('GamesController', () => {
  it('delegates game detail reads to GamesService', async () => {
    const { controller, service } = createController();

    const response = await controller.getGame({ id: 'game-1' } as never, { class: 'guest' });

    expect(service.getGame).toHaveBeenCalledWith('game-1', { class: 'guest' });
    expect(response).toMatchObject({ id: 'game-1' });
  });
});

// D3.25 — docs/18_CATALOG/
describe('GamesController catalog metadata routes', () => {
  it('delegates media listing', async () => {
    const media = [{ id: 'media-1', kind: 'screenshot', url: 'https://cdn/x.jpg' }];
    const { controller, service } = createController({
      listMedia: vi.fn().mockResolvedValue(media),
    } as Partial<GamesService>);

    await expect(controller.listMedia({ id: 'game-1' } as never)).resolves.toEqual(media);
    expect(service.listMedia).toHaveBeenCalledWith('game-1');
  });

  it('delegates similar games', async () => {
    const similar = [{ gameId: null, title: 'Dead Cells', kind: 'similar' }];
    const { controller, service } = createController({
      listSimilar: vi.fn().mockResolvedValue(similar),
    } as Partial<GamesService>);

    await expect(controller.listSimilar({ id: 'game-1' } as never)).resolves.toEqual(similar);
    expect(service.listSimilar).toHaveBeenCalledWith('game-1');
  });

  it('delegates metadata status', async () => {
    const { controller, service } = createController();

    const response = await controller.getMetadataStatus({ id: 'game-1' } as never);

    expect(service.getMetadataStatus).toHaveBeenCalledWith('game-1');
    expect(response).toMatchObject({ gameId: 'game-1' });
  });

  it('propagates a not-found error rather than swallowing it', async () => {
    const { controller } = createController({
      listMedia: vi.fn().mockRejectedValue(new Error('Game not found')),
    } as Partial<GamesService>);

    await expect(controller.listMedia({ id: 'missing' } as never)).rejects.toThrow(
      'Game not found',
    );
  });
});
