ALTER TABLE `guilds` ADD COLUMN `orderChannelId` VARCHAR(19) NULL;

CREATE TABLE `orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdById` VARCHAR(19) NOT NULL,
    `details` TEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'OPEN',
    `claimedById` VARCHAR(19) NULL,
    `claimedAt` DATETIME(3) NULL,
    `channelId` VARCHAR(19) NOT NULL,
    `messageId` VARCHAR(19) NULL,
    `guildId` VARCHAR(19) NOT NULL,

    INDEX `orders_guildId_status_createdAt_idx` (`guildId`, `status`, `createdAt`),
    PRIMARY KEY (`id`),
    CONSTRAINT `orders_guildId_fkey` FOREIGN KEY (`guildId`) REFERENCES `guilds` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;