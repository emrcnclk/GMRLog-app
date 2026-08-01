import { describe, expect, it, vi } from 'vitest';

import { BlocksController } from './blocks.controller';
import { BlocksService } from './blocks.service';

describe('BlocksController', () => {
  it('delegates block mutations to BlocksService', async () => {
    const blocksService = {
      blockUser: vi.fn().mockResolvedValue({ id: 'block-1' }),
      unblockUser: vi.fn().mockResolvedValue(undefined),
    } as unknown as BlocksService;
    const controller = new BlocksController(blocksService);

    await controller.blockUser({ class: 'player', userId: 'user-1' }, {
      userId: 'user-2',
    } as never);
    await controller.unblockUser({ class: 'player', userId: 'user-1' }, {
      userId: 'user-2',
    } as never);

    expect(blocksService.blockUser).toHaveBeenCalledWith('user-1', { userId: 'user-2' });
    expect(blocksService.unblockUser).toHaveBeenCalledWith('user-1', 'user-2');
  });
});
