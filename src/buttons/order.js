const { Button } = require('@eartharoid/dbf');
const { MessageFlags } = require('discord.js');
const { isStaff } = require('../lib/users');
const {
	activeStatuses, buildOrderComponents, buildOrderEmbed,
} = require('../lib/orders');

module.exports = class OrderButton extends Button {
	constructor(client, options) {
		super(client, {
			...options,
			id: 'order',
		});
	}

	async run(id, interaction) {
		if (!await isStaff(interaction.guild, interaction.user.id)) {
			return interaction.reply({
				content: 'Only staff members can update orders.',
				flags: MessageFlags.Ephemeral,
			});
		}

		const orderId = Number(id.orderId);
		if (!Number.isSafeInteger(orderId) || !['complete', 'cancel'].includes(id.action)) {
			return interaction.reply({
				content: 'This order action is invalid.',
				flags: MessageFlags.Ephemeral,
			});
		}

		const order = await this.client.prisma.order.findUnique({ where: { id: orderId } });
		if (
			!order ||
			order.guildId !== interaction.guildId ||
			order.channelId !== interaction.channelId ||
			order.messageId !== interaction.message.id
		) {
			return interaction.reply({
				content: 'This order could not be found.',
				flags: MessageFlags.Ephemeral,
			});
		}
		if (!activeStatuses.includes(order.status)) {
			return interaction.reply({
				content: `Order #${order.id} is already ${order.status.toLowerCase()}.`,
				flags: MessageFlags.Ephemeral,
			});
		}

		const status = id.action === 'complete' ? 'COMPLETED' : 'CANCELLED';
		const result = await this.client.prisma.order.updateMany({
			data: { status },
			where: {
				guildId: interaction.guildId,
				id: order.id,
				status: { in: activeStatuses },
			},
		});
		if (!result.count) {
			return interaction.reply({
				content: `Order #${order.id} has already been updated.`,
				flags: MessageFlags.Ephemeral,
			});
		}

		const updatedOrder = {
			...order,
			status,
		};
		await interaction.update({
			components: buildOrderComponents(updatedOrder),
			embeds: [buildOrderEmbed(updatedOrder, interaction.guild)],
		});

		try {
			const customer = await this.client.users.fetch(order.createdById);
			const result = status === 'COMPLETED' ? 'completed' : 'cancelled';
			await customer.send({
				allowedMentions: { parse: [] },
				content: `Your order #${order.id} was ${result}.`,
				embeds: [buildOrderEmbed(updatedOrder, interaction.guild)],
			});
		} catch (error) {
			this.client.log.warn(`Could not DM customer about order #${order.id}: ${error.message}`);
		}
	}
};