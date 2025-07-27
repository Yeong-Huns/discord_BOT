const { CommandLog } = require('../schema/log.schema');
const convertDate = require("./convertDate");

/*
const type = {
	userId,
	username,
	serverId,
	servername,
	commandName,
	optionAmount = null,
	userBalance = null,
}
*/

async function saveCommandLog(interaction, options = {}) {
	const date = convertDate(new Date());
	const data = {
		userId: interaction.user.id,
		username: interaction.user.username,
		serverId: interaction.guildId,
		servername: interaction.guild.name,
		commandName: interaction.commandName,
	}
	const log = new CommandLog({
		...data,
		...options,
		date,
	});
	await log.save();
}

module.exports = {
	saveCommandLog,
};