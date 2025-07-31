/**
 * fileName       : clean-up
 * author         : Yeong-Huns
 * date           : 25. 7. 31.
 * ===========================================================
 * DATE              AUTHOR             NOTE
 * -----------------------------------------------------------
 * 25. 7. 31.        Yeong-Huns       최초 생성
 */

/* Command 정의 */
import { PermissionsBitField, SlashCommandBuilder} from "discord.js";
import {CleanService} from "../service/clean-up.service.js";

const slashCommand = new SlashCommandBuilder()
	.setName('청소')
	.setDescription('지정한 수의 메시지를 현재 채널에서 삭제합니다.')
	.addIntegerOption(option =>
		option
			.setName('갯수')
			.setDescription('삭제할 메시지의 개수 (1-100)')
			.setRequired(true)
			.setMinValue(1)
			.setMaxValue(100))
	.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)
	.setDMPermission(false); /* deprecated 예정 */

/* execute 함수 */
const execute = async (interaction) => {
	try {
		const cleanService = new CleanService(interaction);
		const replyOptions = await cleanService.processCleaning();

		await interaction.reply(replyOptions);

	} catch (error) {
		console.error('청소 명령어 처리 중 예상치 못한 오류 발생:', error);
		if (!interaction.replied && !interaction.deferred) {
			await interaction.reply({
				content: '메시지 삭제 처리 중 예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
				ephemeral: true
			});
		}
	}
};

export default {
	data: slashCommand,
	execute,
};