const { SlashCommand } = require('@eartharoid/dbf');
const {
	ApplicationCommandOptionType,
	ChannelType,
	PermissionsBitField,
	PermissionFlagsBits,
	MessageFlags,
} = require('discord.js');
const {
	buildOrderComponents, buildOrderEmbed,
} = require('../../lib/orders');

module.exports = class OrderSlashCommand extends SlashCommand {
	constructor(client, options) {
		super(client, {
			...options,
			description: 'Submit an order or configure the order channel',
			dmPermission: false,
			name: 'order',
			options: [
				{
					description: 'Submit a new order',
					name: 'submit',
					options: [
						{
							description: 'Describe what you would like to order',
							maxLength: 1000,
							minLength: 1,
							name: 'details',
							required: true,
							type: ApplicationCommandOptionType.String,
						},
					],
					type: ApplicationCommandOptionType.Subcommand,
				},
				{
					description: 'Choose where order embeds are sent',
					name: 'setup',
					options: [
						{
							channelTypes: [ChannelType.GuildText],
							description: 'The channel where customer orders will appear',
							name: 'channel',
							required: true,
							type: ApplicationCommandOptionType.Channel,
						},
					],
					type: ApplicationCommandOptionType.Subcommand,
				},
			],
		});
	}

	async run(interaction) {
		const client = this.client;
		const subcommand = interaction.options.getSubcommand();

		if (subcommand === 'setup') {
			if (!interaction.memberPermissions.has(PermissionsBitField.Flags.ManageGuild)) {
				return interaction.reply({
					content: 'Only server managers can set the order channel.',
					flags: MessageFlags.Ephemeral,
				});
			}

			const channel = interaction.options.getChannel('channel', true);
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

			await client.prisma.guild.update({
				data: { orderChannelId: channel.id },
				where: { id: interaction.guildId },
			});
			return interaction.reply({
				content: `Customer orders will be posted in ${channel}.`,
				flags: MessageFlags.Ephemeral,
			});
		}

		await interaction.deferReply({ flags: MessageFlags.Ephemeral });
		const settings = await client.prisma.guild.findUnique({ where: { id: interaction.guildId } });
		if (!settings.orderChannelId) {
			return interaction.editReply('An order channel has not been set. A server manager can run `/order setup` first.');
		}

		const channel = await client.channels.fetch(settings.orderChannelId).catch(() => null);
		if (!channel?.isTextBased() || channel.guildId !== interaction.guildId) {
			return interaction.editReply('The configured order channel is unavailable. A server manager needs to run `/order setup` again.');
		}

		const order = await client.prisma.order.create({
			data: {
				channelId: channel.id,
				createdById: interaction.user.id,
				details: interaction.options.getString('details', true),
				guildId: interaction.guildId,
			},
		});

		let message;
		try {
			message = await channel.send({ embeds: [buildOrderEmbed(order, interaction.guild)] });
			await client.prisma.order.update({
				data: { messageId: message.id },
				where: { id: order.id },
			});
			await message.edit({ components: buildOrderComponents(order) });
		} catch (error) {
			if (message) await message.delete().catch(() => {});
			await client.prisma.order.delete({ where: { id: order.id } });
			client.log.error(error);
			return interaction.editReply('I could not post your order. Please check the order channel permissions and try again.');
		}

		return interaction.editReply(`Your order #${order.id} has been submitted.`);
	}
};