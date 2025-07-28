/**
 * fileName       : water-temperature
 * author         : Yeong-Huns
 * date           : 25. 7. 28.
 * ===========================================================
 * DATE              AUTHOR             NOTE
 * -----------------------------------------------------------
 * 25. 7. 28.        Yeong-Huns       최초 생성
 */
import {SlashCommandBuilder} from "discord.js";
import {WaterTemperatureService} from "../service/water-temperature.service.js";
import {errorReply} from "../../utils/error-reply.js";

/* Command */
const slashCommand =
	new SlashCommandBuilder()
		.setName('수온')
		.setDescription('한강 및 주요지천 수온을 알려줍니다.')
		.addStringOption(option =>
			option
				.setName('하천')
				.setDescription('수온을 알고 싶은 강을 선택하세요.')
				.setRequired(true)
				.addChoices(
					{name: '중랑천', value: '중랑천'},
					{name: '탄천', value: '탄천'},
					{name: '안양천', value: '안양천'}
				)
		);

/* Service */
const execute = async (interaction) => {
	try{
		const waterTemperatureService = new WaterTemperatureService(interaction);
		const replyOptions = await waterTemperatureService.createReply();
		await interaction.reply(replyOptions);
	} catch (error) {
		await errorReply(interaction, error, '`/수온`');
	}
}

export default {
	data: slashCommand,
	execute,
};