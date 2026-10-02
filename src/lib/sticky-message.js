const { EmbedBuilder } = require('discord.js');
const ms = require('ms');

const getStickyCacheKey = (guildId, channelId) => `cache/sticky-message:${guildId}:${channelId}`;

const buildStickyEmbed = (content, colour) => new EmbedBuilder()
	.setColor(colour)
	.setTitle('Sticky message')
	.setDescription(content);

const keepStickyMessage = async (client, message, settings, channelLocks) => {
	if (message.author.id === client.user.id || channelLocks.has(message.channel.id)) return;
	channelLocks.add(message.channel.id);
	const cacheKey = getStickyCacheKey(message.guild.id, message.channel.id);

	try {
		let sticky = await client.keyv.get(cacheKey);
		if (sticky === undefined) {
			sticky = await client.prisma.stickyMessage.findUnique({
				where: {
					guildId_channelId: {
						channelId: message.channel.id,
						guildId: message.guild.id,
					},
				},
			});
			await client.keyv.set(cacheKey, sticky, ms('1h'));
		}
		if (!sticky) return;

		let stickyMessage;
		try {
			stickyMessage = await message.channel.send({
				allowedMentions: { parse: [] },
				embeds: [buildStickyEmbed(sticky.content, settings.primaryColour)],
			});
			await client.prisma.stickyMessage.update({
				data: { messageId: stickyMessage.id },
				where: {
					guildId_channelId: {
						channelId: message.channel.id,
						guildId: message.guild.id,
					},
				},
			});
		} catch (error) {
			if (stickyMessage) await stickyMessage.delete().catch(() => {});
			throw error;
		}

		if (sticky.messageId) {
			await message.channel.messages.delete(sticky.messageId).catch(error => {
				if (error.code !== 10008) client.log.warn(`Failed to delete old sticky message: ${error.message}`);
			});
		}
		sticky.messageId = stickyMessage.id;
		await client.keyv.set(cacheKey, sticky, ms('1h'));
	} catch (error) {
		client.log.warn(`Failed to repost sticky message in ${message.channel.id}: ${error.message}`);
	} finally {
		channelLocks.delete(message.channel.id);
	}
};

module.exports = {
	buildStickyEmbed,
	getStickyCacheKey,
	keepStickyMessage,
};