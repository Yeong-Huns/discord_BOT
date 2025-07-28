/**
 * fileName       : balance
 * author         : Yeong-Huns
 * date           : 25. 7. 28.
 * ===========================================================
 * DATE              AUTHOR             NOTE
 * -----------------------------------------------------------
 * 25. 7. 28.        Yeong-Huns       최초 생성
 */
import {SlashCommandBuilder} from "discord.js";
import {BalanceService} from "../service/balance.service.js";
import {errorReply} from "../../utils/error-reply.js";

/* Command */
const slashCommand =
	new SlashCommandBuilder()
		.setName('잔액')
		.setDescription('잔액을 조회합니다')
		.addUserOption(option =>
			option
				.setName('유저')
				.setDescription('잔액을 조회할 유저를 선택하세요')
				.setRequired(false)
		);

/* Service */
const execute = async (interaction) => {
	try {
		const balanceService = new BalanceService(interaction);
		const replyOptions = await balanceService.createReply();
		await interaction.reply(replyOptions);
	} catch (error) {
		await errorReply(interaction, error, '`/잔액`');
	}
};

export default {
	data: slashCommand,
	execute,
};