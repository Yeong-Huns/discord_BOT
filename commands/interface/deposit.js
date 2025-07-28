/**
 * fileName       : deposit
 * author         : Yeong-Huns
 * date           : 25. 7. 28.
 * ===========================================================
 * DATE              AUTHOR             NOTE
 * -----------------------------------------------------------
 * 25. 7. 28.        Yeong-Huns       최초 생성
 */
import {SlashCommandBuilder} from "discord.js";
import {DepositService} from "../service/deposit.service.js";
import {errorReply} from "../../utils/error-reply.js";

/* Command */
const slashCommand =
	new SlashCommandBuilder()
		.setName('돈줘')
		.setDescription('게임을 하기 위한 돈을 받습니다.');

/* Service */
const execute = async (interaction) => {
	try{
		const depositService = new DepositService(interaction);
		const replyOptions = await depositService.createReply();
		await interaction.reply(replyOptions);
	}catch (error) {
		await errorReply(interaction, error, '`/돈줘`');
	}
}

export default {
	data: slashCommand,
	execute,
}