-- D3.19: upload hot-path indexes for orphan cleanup and key lookup
CREATE INDEX IF NOT EXISTS "uploads_storage_key_idx" ON "uploads"("storage_key");
CREATE INDEX IF NOT EXISTS "uploads_status_created_at_idx" ON "uploads"("status", "created_at");
