import type { Game, PrismaClient, User } from '@prisma/client';

let counter = 0;
function unique(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter.toString(36)}-${Date.now().toString(36)}`;
}

export function createUser(
  prisma: PrismaClient,
  overrides: Partial<{ handle: string; displayName: string }> = {},
): Promise<User> {
  return prisma.user.create({
    data: {
      handle: overrides.handle ?? unique('user'),
      displayName: overrides.displayName ?? 'Player',
    },
  });
}

export function createGame(
  prisma: PrismaClient,
  overrides: Partial<{ title: string; slug: string }> = {},
): Promise<Game> {
  return prisma.game.create({
    data: {
      title: overrides.title ?? 'A Game',
      slug: overrides.slug ?? unique('game'),
    },
  });
}

export function createCommunity(
  prisma: PrismaClient,
  overrides: Partial<{ name: string; slug: string; description: string | null }> = {},
): Promise<{ id: string; name: string; slug: string }> {
  return prisma.community.create({
    data: {
      name: overrides.name ?? 'Culture Room',
      slug: overrides.slug ?? unique('community'),
      ...(overrides.description !== undefined ? { description: overrides.description } : {}),
    },
  });
}
