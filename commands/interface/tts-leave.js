/**
 * fileName       : tts-leave
 * author         : Yeong-Huns
 * date           : 26. 8. 22.
 * ===========================================================
 * DATE              AUTHOR             NOTE
 * -----------------------------------------------------------
 * 26. 8. 22.        Yeong-Huns       최초 생성
 */
import {SlashCommandBuilder} from "discord.js";
import {TtsService} from "../service/tts.service.js";
import {saveCommandLog} from "../../utils/logging.js";
import {errorReply} from "../../utils/error-reply.js";

/* Command */
const slashCommand = new SlashCommandBuilder()
	.setName('나가')
	.setDescription('음성 채널에서 나가고 TTS 기능을 종료합니다.');

/* Service */
const execute = async (interaction) => {
	try {
		const ttsService = new TtsService(interaction);
		const replyOptions = await ttsService.leave();
		await interaction.reply(replyOptions);
		await saveCommandLog(interaction);
	} catch (error) {
		await errorReply(interaction, error, '`/나가`');
	}
};

export default {
	data: slashCommand,
	execute,
};
