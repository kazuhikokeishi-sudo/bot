const { Listener } = require('@eartharoid/dbf');
const { keepStickyMessage } = require('../../lib/sticky-message');

module.exports = class StickyMessageListener extends Listener {
	constructor(client, options) {
		super(client, {
			...options,
			emitter: client,
			event: 'messageCreate',
		});
		this.channels = new Set();
	}

	async run(message) {
		if (!message.guild || message.author.id === this.client.user.id) return;

		const settings = await this.client.prisma.guild.findUnique({
			select: {
				id: true,
				primaryColour: true,
			},
			where: { id: message.guild.id },
		});
		if (!settings) return;

		await keepStickyMessage(this.client, message, settings, this.channels);
	}
};