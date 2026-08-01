import { PrismaClient } from '@prisma/client';

// Probe: send startup to see server
const prisma = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.DATABASE_URL ??
        'postgresql://gmrlog:gmrlog@127.0.0.1:5432/gmrlog?schema=public',
    },
  },
});

try {
  const version = await prisma.$queryRawUnsafe('SELECT version()');
  const lc = await prisma.$queryRawUnsafe('SHOW lc_messages');
  const who = await prisma.$queryRawUnsafe(
    'SELECT current_user, inet_server_addr(), inet_server_port()',
  );
  console.log(JSON.stringify({ version, lc, who }, null, 2));
} catch (error) {
  console.error('ERR', error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
