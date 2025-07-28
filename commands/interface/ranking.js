/**
 * fileName       : ranking.js
 * author         : Yeong-Huns
 * date           : 25. 7. 28.
 * ===========================================================
 * DATE              AUTHOR             NOTE
 * -----------------------------------------------------------
 * 25. 7. 28.        Yeong-Huns       최초 생성
 */
import {SlashCommandBuilder} from 'discord.js';
import {RankingService} from '../service/ranking.service.js';
import {errorReply} from "../../utils/error-reply.js";

/* Command */
const slashCommand = new SlashCommandBuilder()
	.setName('랭킹')
	.setDescription('게임 잔액 순위표를 보여줍니다')
	.addStringOption(option =>
		option
			.setName('기준')
			.setDescription('기준을 선택해 주세요')
			.setRequired(true)
			.addChoices(
				{ name: '전체', value: '전체' },
				{ name: '서버', value: '서버' }
			));

/* Service */
const execute = async (interaction) => {
	try {
		const rankingService = new RankingService(interaction);
		const replyOptions = await rankingService.createReply();
		await interaction.reply(replyOptions);
	} catch (error) {
		await errorReply(interaction, error, '`/랭킹`');
	}
};

export default {
	data: slashCommand,
	execute,
}