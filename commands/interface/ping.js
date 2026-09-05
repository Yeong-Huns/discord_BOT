/**
 * fileName       : ping
 * author         : Yeong-Huns
 * date           : 26. 8. 22.
 * ===========================================================
 * DATE              AUTHOR             NOTE
 * -----------------------------------------------------------
 * 26. 8. 22.        Yeong-Huns       최초 생성
 */
import {SlashCommandBuilder} from "discord.js";
import {PingService} from "../service/ping.service.js";
import {saveCommandLog} from "../../utils/logging.js";
import {errorReply} from "../../utils/error-reply.js";

/* Command */
const slashCommand = new SlashCommandBuilder()
	.setName('핑')
	.setDescription('서버의 상태를 확인합니다.');

/* Service */
const execute = async (interaction) => {
	try {
		const pingService = new PingService(interaction);
		const replyOptions = await pingService.createReply();
		await interaction.reply(replyOptions);
		await saveCommandLog(interaction);
	} catch (error) {
		await errorReply(interaction, error, '`/핑`');
	}
};

export default {
	data: slashCommand,
	execute,
};
