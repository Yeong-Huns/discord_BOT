import { CommandLog } from "../schema/log.schema.js";
import convertDate from "./convertDate.js";

export async function saveCommandLog(interaction, options = {}) {
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