/**
 * fileName       : transfer
 * author         : Yeong-Huns
 * date           : 25. 7. 29.
 * ===========================================================
 * DATE              AUTHOR             NOTE
 * -----------------------------------------------------------
 * 25. 7. 29.        Yeong-Huns       최초 생성
 */
import {SlashCommandBuilder} from "discord.js";
import {TransferService} from "../service/transfer.service.js";
import {errorReply} from "../../utils/error-reply.js";

/* Command */
const slashCommand = new SlashCommandBuilder()
	.setName('송금')
	.setDescription('다른 유저에게 돈을 보냅니다.')
	.addUserOption(option =>
		option
			.setName('유저')
			.setDescription('돈을 받을 유저를 선택하세요.')
			.setRequired(true))
	.addIntegerOption(option =>
		option
			.setName('송금액')
			.setDescription('보낼 금액을 입력하세요.')
			.setRequired(true)
			.setMinValue(1000));

const execute = async (interaction) => {
	try {
		const transferService = new TransferService(interaction);
		const replyOptions = await transferService.createReply();
		await interaction.reply(replyOptions);
	} catch (error) {
		await errorReply(interaction, error, '`/송금`');
		console.error('송금 명령어 처리 중 예상치 못한 오류 발생:', error);
	}
};

export default {
	data: slashCommand,
	execute,
};