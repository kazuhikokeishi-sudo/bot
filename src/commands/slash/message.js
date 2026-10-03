const { SlashCommand } = require('@eartharoid/dbf');
const {
	ApplicationCommandOptionType,
	ChannelType,
	MessageFlags,
	PermissionFlagsBits,
	PermissionsBitField,
} = require('discord.js');

module.exports = class MessageSlashCommand extends SlashCommand {
	constructor(client, options) {
		super(client, {
			...options,
			description: 'Send a message as the bot',
			dmPermission: false,
			name: 'message',
			options: [
				{
					channelTypes: [ChannelType.GuildText, ChannelType.GuildAnnouncement],
					description: 'Where the bot should send the message',
					name: 'channel',
					required: false,
					type: ApplicationCommandOptionType.Channel,
				},
				{
					description: 'The message text',
					maxLength: 2000,
					minLength: 1,
					name: 'text',
					required: true,
					type: ApplicationCommandOptionType.String,
				},
			],
		});
	}

	async run(interaction) {
		if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageGuild)) {
			return interaction.reply({
				content: 'Only server managers can send messages as the bot.',
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

		const permissions = channel.permissionsFor(interaction.guild.members.me);
		if (!permissions?.has([
			PermissionFlagsBits.ViewChannel,
			PermissionFlagsBits.SendMessages,
		])) {
			return interaction.reply({
				content: 'I need permission to view and send messages in that channel.',
				flags: MessageFlags.Ephemeral,
			});
		}

		try {
			await channel.send({
				allowedMentions: { parse: [] },
				content: interaction.options.getString('text', true),
			});
		} catch (error) {
			this.client.log.error(error);
			return interaction.reply({
				content: 'I could not send the message. Check my permissions and try again.',
				flags: MessageFlags.Ephemeral,
			});
		}

		return interaction.reply({
			content: `Message sent in ${channel}.`,
			flags: MessageFlags.Ephemeral,
		});
	}
};