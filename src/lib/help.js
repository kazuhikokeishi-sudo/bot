const ExtendedEmbedBuilder = require('./embed');
const { version } = require('../../package.json');

const buildHelpEmbeds = (client, guild, settings, staff, getMessage) => {
	const getCommandName = (command, type, fallback) => {
		const published = client.application.commands.cache.find(appCommand => appCommand.type === type && appCommand.name === command.name);
		return published ? `</${published.name}:${published.id}>` : fallback;
	};
	const commands = [
		...[...client.commands.commands.slash.values()].map(command => ({
			name: command.name,
			text: `**${getCommandName(command, 1, `\`/${command.name}\``)}** - ${command.description}`,
		})),
		...[...client.commands.commands.message.values()].map(command => ({
			name: `Message: ${command.name}`,
			text: `**${getCommandName(command, 3, `\`${command.name}\``)}** - Message context command`,
		})),
		...[...client.commands.commands.user.values()].map(command => ({
			name: `User: ${command.name}`,
			text: `**${getCommandName(command, 2, `\`${command.name}\``)}** - User context command`,
		})),
	].sort((a, b) => a.name.localeCompare(b.name));

	const newCommand = client.commands.commands.slash.get('new');
	const newCommandMention = newCommand ? getCommandName(newCommand, 1, `\`/${newCommand.name}\``) : '`/new`';
	const intro = staff
		? `**Discord Tickets v${version} by eartharoid.**`
		: getMessage('commands.slash.help.response.description', { command: newCommandMention });
	const pages = [];
	let description = `${intro}\n\n`;

	for (const command of commands) {
		if (description.length + command.text.length + 1 > 3800 && description.trim()) {
			pages.push(description.trim());
			description = '';
		}
		description += `${command.text}\n`;
	}
	if (description.trim() || pages.length === 0) pages.push(description.trim() || 'No slash commands are loaded.');

	return pages.map((page, index) => {
		const embed = new ExtendedEmbedBuilder({
			iconURL: guild.iconURL(),
			text: settings.footer,
		})
			.setColor(settings.primaryColour)
			.setTitle(`${getMessage('commands.slash.help.title')} | Commands`)
			.setDescription(page);

		if (staff && index === 0) {
			embed.addFields(
				{
					inline: true,
					name: getMessage('commands.slash.help.response.links.links'),
					value: [
						['commands', 'https://discordtickets.app/features/commands'],
						['docs', 'https://discordtickets.app'],
						['feedback', 'https://lnk.earth/dsctickets-feedback'],
						['support', 'https://lnk.earth/discord'],
					]
						.map(([label, url]) => `> [${getMessage('commands.slash.help.response.links.' + label)}](${url})`)
						.join('\n'),
				},
				{
					inline: true,
					name: getMessage('commands.slash.help.response.settings'),
					value: '> ' + process.env.HTTP_EXTERNAL + '/settings',
				},
			);
		}

		if (pages.length > 1) embed.setFooter({ text: `Page ${index + 1} of ${pages.length}` });
		return embed;
	});
};

module.exports = { buildHelpEmbeds };