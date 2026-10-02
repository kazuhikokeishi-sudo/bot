CREATE TABLE "stickyMessages" (
    "channelId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guildId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,

    PRIMARY KEY ("guildId", "channelId"),
    CONSTRAINT "stickyMessages_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "guilds" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);