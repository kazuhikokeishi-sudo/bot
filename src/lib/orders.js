const {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
} = require('discord.js');

const activeStatuses = ['OPEN', 'CLAIMED'];

const buildOrderComponents = order => {
	if (!activeStatuses.includes(order.status)) return [];
	return [
		new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId(JSON.stringify({
					action: 'complete',
					orderId: String(order.id),
				}))
				.setLabel('Complete')
				.setStyle(ButtonStyle.Success),
			new ButtonBuilder()
				.setCustomId(JSON.stringify({
					action: 'cancel',
					orderId: String(order.id),
				}))
				.setLabel('Cancel')
				.setStyle(ButtonStyle.Danger),
		),
	];
};

const buildOrderEmbed = (order, guild) => new EmbedBuilder()
	.setColor(order.status === 'COMPLETED' ? guild.successColour : order.status === 'CANCELLED' ? guild.errorColour : guild.primaryColour)
	.setTitle(`Order #${order.id}`)
	.setDescription(order.details)
	.addFields(
		{
			inline: true,
			name: 'Customer',
			value: `<@${order.createdById}>`,
		},
		{
			inline: true,
			name: 'Status',
			value: order.status.toLowerCase(),
		},
		{
			inline: true,
			name: 'Claimed by',
			value: order.claimedById ? `<@${order.claimedById}>` : 'Unclaimed',
		},
	)
	.setTimestamp(order.createdAt);

const updateOrderMessage = async (client, order) => {
	if (!order.messageId) return;
	const channel = await client.channels.fetch(order.channelId);
	if (!channel?.isTextBased()) return;
	const message = await channel.messages.fetch(order.messageId);
	await message.edit({
		components: buildOrderComponents(order),
		embeds: [buildOrderEmbed(order, channel.guild)],
	});
};

const claimNextOrder = async (client, interaction) => {
	for (let attempt = 0; attempt < 3; attempt++) {
		const order = await client.prisma.order.findFirst({
			orderBy: { createdAt: 'asc' },
			where: {
				guildId: interaction.guildId,
				status: 'OPEN',
			},
		});
		if (!order) break;

		const result = await client.prisma.order.updateMany({
			data: {
				claimedAt: new Date(),
				claimedById: interaction.user.id,
				status: 'CLAIMED',
			},
			where: {
				guildId: interaction.guildId,
				id: order.id,
				status: 'OPEN',
			},
		});
		if (!result.count) continue;

		const claimedOrder = await client.prisma.order.findUnique({ where: { id: order.id } });
		try {
			await updateOrderMessage(client, claimedOrder);
		} catch (error) {
			client.log.warn(`Failed to update order #${order.id} message: ${error.message}`);
		}

		return interaction.reply({
			content: `You claimed order #${order.id}.`,
			ephemeral: true,
		});
	}

	return interaction.reply({
		content: 'There are no unclaimed orders in the queue.',
		ephemeral: true,
	});
};

module.exports = {
	activeStatuses,
	buildOrderComponents,
	buildOrderEmbed,
	claimNextOrder,
	updateOrderMessage,
};