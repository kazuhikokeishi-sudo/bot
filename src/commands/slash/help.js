const { SlashCommand } = require('@eartharoid/dbf');
const { isStaff } = require('../../lib/users');
const { buildHelpEmbeds } = require('../../lib/help');
const { MessageFlags } = require('discord.js');

module.exports = class HelpSlashCommand extends SlashCommand {
	constructor(client, options) {
		const name = 'help';
		super(client, {
			...options,
			description: client.i18n.getMessage(null, `commands.slash.${name}.description`),
			descriptionLocalizations: client.i18n.getAllMessages(`commands.slash.${name}.description`),
			dmPermission: false,
			name,
			nameLocalizations: client.i18n.getAllMessages(`commands.slash.${name}.name`),
		});
	}

	/**
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 */
	async run(interaction) {
		const client = this.client;
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const staff = await isStaff(interaction.guild, interaction.user.id);
		const settings = await client.prisma.guild.findUnique({ where: { id: interaction.guild.id } });
		const getMessage = client.i18n.getLocale(settings.locale);
		const embeds = buildHelpEmbeds(client, interaction.guild, settings, staff, getMessage);

		await interaction.editReply({ embeds: [embeds[0]] });
		for (const embed of embeds.slice(1)) {
			await interaction.followUp({
				embeds: [embed],
				flags: MessageFlags.Ephemeral,
			});
		}
	}
};
