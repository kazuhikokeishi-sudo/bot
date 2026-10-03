const { Listener } = require('@eartharoid/dbf');
const { buildHelpEmbeds } = require('../../lib/help');

module.exports = class HelpMessageListener extends Listener {
	constructor(client, options) {
		super(client, {
			...options,
			emitter: client,
			event: 'messageCreate',
		});
	}

	async run(message) {
		if (!message.guild || message.author.bot || message.content.trim().toLowerCase() !== ',help') return;

		const settings = await this.client.prisma.guild.findUnique({ where: { id: message.guild.id } });
		if (!settings) return;

		const getMessage = this.client.i18n.getLocale(settings.locale);
		const embeds = buildHelpEmbeds(this.client, message.guild, settings, false, getMessage);
		await message.reply({
			allowedMentions: {
				parse: [],
				repliedUser: false,
			},
			embeds: [embeds[0]],
		});
		for (const embed of embeds.slice(1)) {
			await message.channel.send({
				allowedMentions: { parse: [] },
				embeds: [embed],
			});
		}
	}
};