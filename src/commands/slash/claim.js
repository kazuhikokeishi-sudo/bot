const { SlashCommand } = require('@eartharoid/dbf');
const { claimNextOrder } = require('../../lib/orders');
const { isStaff } = require('../../lib/users');

module.exports = class ClaimSlashCommand extends SlashCommand {
	constructor(client, options) {
		const name = 'claim';
		super(client, {
			...options,
			description: 'Claim a ticket, or claim the next order in the order channel',
			dmPermission: false,
			name,
			nameLocalizations: client.i18n.getAllMessages(`commands.slash.${name}.name`),
		});
	}

	/**
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 */
	async run(interaction) {
		/** @type {import("client")} */
		const client = this.client;

		const settings = await client.prisma.guild.findUnique({
			select: { orderChannelId: true },
			where: { id: interaction.guildId },
		});
		if (settings?.orderChannelId === interaction.channelId) {
			if (!(await isStaff(interaction.guild, interaction.user.id))) {
				return interaction.reply({
					content: 'Only staff members can claim orders.',
					ephemeral: true,
				});
			}
			return claimNextOrder(client, interaction);
		}

		await client.tickets.claim(interaction);
	}
};
