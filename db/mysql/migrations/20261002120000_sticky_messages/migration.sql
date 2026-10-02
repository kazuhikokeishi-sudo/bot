CREATE TABLE `stickyMessages` (
    `channelId` VARCHAR(19) NOT NULL,
    `content` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `guildId` VARCHAR(19) NOT NULL,
    `messageId` VARCHAR(19) NOT NULL,

    PRIMARY KEY (`guildId`, `channelId`),
    CONSTRAINT `stickyMessages_guildId_fkey` FOREIGN KEY (`guildId`) REFERENCES `guilds` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;