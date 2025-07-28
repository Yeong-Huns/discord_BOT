/**
 * fileName       : gamble
 * author         : Yeong-Huns
 * date           : 25. 7. 28.
 * ===========================================================
 * DATE              AUTHOR             NOTE
 * -----------------------------------------------------------
 * 25. 7. 28.        Yeong-Huns       최초 생성
 */
import {SlashCommandBuilder} from 'discord.js';
import {GambleService} from "../service/gamble.service.js";
import {errorReply} from "../../utils/error-reply.js";

/* Command */
const slashCommand =
	new SlashCommandBuilder()
		.setName('도박')
		.setDescription('돈을 걸고 도박을 합니다')
		.addIntegerOption(option =>
			option.setName('금액')
				.setDescription('배팅할 금액을 입력하세요.')
				.setRequired(true)
				.setMinValue(500)
		);

/* Service */
const execute = async (interaction) => {
	try {
		const gambleService = new GambleService(interaction);
		const replyOptions = await gambleService.createReply();
		await interaction.reply(replyOptions);
	} catch (error) {
		await errorReply(interaction, error, '`/도박`');
	}
}

export default {
	data: slashCommand,
	execute,
}