ALTER TABLE "guilds" ADD COLUMN "orderChannelId" VARCHAR(19);

CREATE TABLE "orders" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" VARCHAR(19) NOT NULL,
    "details" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "claimedById" VARCHAR(19),
    "claimedAt" TIMESTAMP(3),
    "channelId" VARCHAR(19) NOT NULL,
    "messageId" VARCHAR(19),
    "guildId" VARCHAR(19) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "orders_guildId_status_createdAt_idx" ON "orders"("guildId", "status", "createdAt");

ALTER TABLE "orders" ADD CONSTRAINT "orders_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE CASCADE;