/**
 * fileName       : help
 * author         : Yeong-Huns
 * date           : 25. 8. 1.
 * ===========================================================
 * DATE              AUTHOR             NOTE
 * -----------------------------------------------------------
 * 25. 8. 1.        Yeong-Huns       최초 생성
 */
import {SlashCommandBuilder} from "discord.js";
import {HelpService} from "../service/help.service.js";
import {errorReply} from "../../utils/error-reply.js";

const slashCommand = new SlashCommandBuilder()
	.setName('도움말')
	.setDescription('도움말을 확인합니다');

const execute = async (interaction) => {
	try {
		const helpService = new HelpService(interaction);
		const replyOptions = await helpService.createReply();
		await interaction.reply(replyOptions);
	} catch (error) {
		await errorReply(interaction, error, '`/도움말`')
	}
}

export default {
	data: slashCommand,
	execute,
}