ALTER TABLE "guilds" ADD COLUMN "orderChannelId" TEXT;

CREATE TABLE "orders" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "claimedById" TEXT,
    "claimedAt" DATETIME,
    "channelId" TEXT NOT NULL,
    "messageId" TEXT,
    "guildId" TEXT NOT NULL,
    CONSTRAINT "orders_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "guilds" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "orders_guildId_status_createdAt_idx" ON "orders"("guildId", "status", "createdAt");