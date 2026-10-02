CREATE TABLE "stickyMessages" (
    "channelId" VARCHAR(19) NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guildId" VARCHAR(19) NOT NULL,
    "messageId" VARCHAR(19) NOT NULL,

    CONSTRAINT "stickyMessages_pkey" PRIMARY KEY ("guildId", "channelId"),
    CONSTRAINT "stickyMessages_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE CASCADE
);