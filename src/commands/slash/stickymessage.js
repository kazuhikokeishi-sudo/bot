const { SlashCommand } = require('@eartharoid/dbf');
const {
	ApplicationCommandOptionType,
	ChannelType,
	MessageFlags,
	PermissionFlagsBits,
	PermissionsBitField,
} = require('discord.js');
const ms = require('ms');
const {
	buildStickyEmbed, getStickyCacheKey,
} = require('../../lib/sticky-message');

const channelOption = {
	channelTypes: [ChannelType.GuildText, ChannelType.GuildAnnouncement],
	description: 'The channel to make sticky',
	name: 'channel',
	required: false,
	type: ApplicationCommandOptionType.Channel,
};

module.exports = class StickyMessageSlashCommand extends SlashCommand {
	constructor(client, options) {
		super(client, {
			...options,
			description: 'Create or remove a sticky embed message',
			dmPermission: false,
			name: 'stickymessage',
			options: [
				{
					description: 'Set or update a sticky embed',
					name: 'set',
					options: [
						{
							description: 'The embed text',
							maxLength: 4000,
							minLength: 1,
							name: 'message',
							required: true,
							type: ApplicationCommandOptionType.String,
						},
						channelOption,
					],
					type: ApplicationCommandOptionType.Subcommand,
				},
				{
					description: 'Remove a channel sticky embed',
					name: 'remove',
					options: [channelOption],
					type: ApplicationCommandOptionType.Subcommand,
				},
			],
		});
	}

	async run(interaction) {
		const client = this.client;
		if (!interaction.memberPermissions.has(PermissionsBitField.Flags.ManageGuild)) {
			return interaction.reply({
				content: 'Only server managers can configure sticky messages.',
				flags: MessageFlags.Ephemeral,
			});
		}

		const channel = interaction.options.getChannel('channel') || interaction.channel;
		if (
			!channel ||
			channel.guildId !== interaction.guildId ||
			![ChannelType.GuildText, ChannelType.GuildAnnouncement].includes(channel.type)
		) {
			return interaction.reply({
				content: 'Choose a text or announcement channel in this server.',
				flags: MessageFlags.Ephemeral,
			});
		}

		const where = {
			guildId_channelId: {
				channelId: channel.id,
				guildId: interaction.guildId,
			},
		};
		const cacheKey = getStickyCacheKey(interaction.guildId, channel.id);
		if (interaction.options.getSubcommand() === 'remove') {
			const sticky = await client.prisma.stickyMessage.findUnique({ where });
			if (!sticky) {
				return interaction.reply({
					content: `There is no sticky message configured for ${channel}.`,
					flags: MessageFlags.Ephemeral,
				});
			}

			await client.prisma.stickyMessage.delete({ where });
			await client.keyv.delete(cacheKey);
			await channel.messages.delete(sticky.messageId).catch(() => {});
			return interaction.reply({
				content: `The sticky message was removed from ${channel}.`,
				flags: MessageFlags.Ephemeral,
			});
		}

		const permissions = channel.permissionsFor(interaction.guild.members.me);
		if (!permissions?.has([
			PermissionFlagsBits.ViewChannel,
			PermissionFlagsBits.SendMessages,
			PermissionFlagsBits.EmbedLinks,
		])) {
			return interaction.reply({
				content: 'I need permission to view and send embeds in that channel.',
				flags: MessageFlags.Ephemeral,
			});
		}

		const settings = await client.prisma.guild.findUnique({ where: { id: interaction.guildId } });
		const content = interaction.options.getString('message', true);
		const previous = await client.prisma.stickyMessage.findUnique({ where });
		const message = await channel.send({
			allowedMentions: { parse: [] },
			embeds: [buildStickyEmbed(content, settings.primaryColour)],
		});
		try {
			await client.prisma.stickyMessage.upsert({
				create: {
					channelId: channel.id,
					content,
					guildId: interaction.guildId,
					messageId: message.id,
				},
				update: {
					content,
					messageId: message.id,
				},
				where,
			});
		} catch (error) {
			await message.delete().catch(() => {});
			throw error;
		}

		if (previous) await channel.messages.delete(previous.messageId).catch(() => {});
		await client.keyv.set(cacheKey, {
			channelId: channel.id,
			content,
			guildId: interaction.guildId,
			messageId: message.id,
		}, ms('1h'));
		return interaction.reply({
			content: `Sticky embed set in ${channel}.`,
			flags: MessageFlags.Ephemeral,
		});
	}
};