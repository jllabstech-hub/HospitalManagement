-- Notification outbox processing timestamps (atomic claim / dead-letter)
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "processingStartedAt" TIMESTAMP(3);
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);

-- Object-storage metadata; never store file bytes or data URLs in PostgreSQL
ALTER TABLE "MediaAsset" ADD COLUMN IF NOT EXISTS "storageKey" TEXT;
ALTER TABLE "MediaAsset" ADD COLUMN IF NOT EXISTS "isPrivate" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "MediaAsset_tenantId_storageKey_idx" ON "MediaAsset"("tenantId", "storageKey");
