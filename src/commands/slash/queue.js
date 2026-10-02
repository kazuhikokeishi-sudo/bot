const { SlashCommand } = require('@eartharoid/dbf');
const {
	EmbedBuilder, MessageFlags,
} = require('discord.js');

module.exports = class QueueSlashCommand extends SlashCommand {
	constructor(client, options) {
		super(client, {
			...options,
			description: 'Display the public order queue',
			dmPermission: false,
			name: 'queue',
		});
	}

	async run(interaction) {
		const settings = await this.client.prisma.guild.findUnique({ where: { id: interaction.guildId } });
		const orders = await this.client.prisma.order.findMany({
			orderBy: { createdAt: 'asc' },
			where: {
				guildId: interaction.guildId,
				status: { in: ['OPEN', 'CLAIMED'] },
			},
		});
		const pages = [];
		for (let index = 0; index < Math.max(orders.length, 1); index += 10) {
			const pageOrders = orders.slice(index, index + 10);
			const description = pageOrders.length
				? pageOrders.map(order => {
					const state = order.status === 'CLAIMED' ? `Claimed by <@${order.claimedById}>` : 'Waiting';
					return `**#${order.id}** | <@${order.createdById}> | ${state}\n${order.details.slice(0, 180)}`;
				}).join('\n\n')
				: 'There are no active orders.';
			pages.push(
				new EmbedBuilder()
					.setColor(settings.primaryColour)
					.setTitle(`Order queue (${orders.length})`)
					.setDescription(description)
					.setFooter({ text: `Page ${Math.floor(index / 10) + 1} of ${Math.max(Math.ceil(orders.length / 10), 1)} | Active orders only` }),
			);
		}

		const message = {
			allowedMentions: { parse: [] },
			flags: MessageFlags.SuppressNotifications,
		};
		await interaction.reply({
			...message,
			embeds: [pages[0]],
		});
		for (const page of pages.slice(1)) {
			await interaction.followUp({
				...message,
				embeds: [page],
			});
		}
	}
};