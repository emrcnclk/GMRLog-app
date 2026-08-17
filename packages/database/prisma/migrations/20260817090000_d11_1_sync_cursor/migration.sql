-- D11.1: durable high-water mark for a named bulk sync job (IGDB catalog mirror).
CREATE TABLE "sync_cursors" (
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sync_cursors_pkey" PRIMARY KEY ("name")
);
