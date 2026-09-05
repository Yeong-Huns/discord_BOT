/**
 * fileName       : select-gif
 * author         : Yeong-Huns
 * date           : 26. 8. 22.
 * ===========================================================
 * DATE              AUTHOR             NOTE
 * -----------------------------------------------------------
 * 26. 8. 22.        Yeong-Huns       최초 생성
 */
import {SlashCommandBuilder} from "discord.js";
import {SelectEmojiService} from "../service/select-emoji.service.js";
import {saveCommandLog} from "../../utils/logging.js";
import {errorReply} from "../../utils/error-reply.js";

/* Command */
const slashCommand = new SlashCommandBuilder()
	.setName('움짤')
	.setDescription('서버에 등록된 움직이는(GIF) 이모지를 출력합니다.');

/* Service */
const execute = async (interaction) => {
	try {
		const emojiService = new SelectEmojiService(interaction, { animated: true });
		await emojiService.sendSelector();
		await saveCommandLog(interaction);
	} catch (error) {
		await errorReply(interaction, error, '`/움짤`');
	}
};

export default {
	data: slashCommand,
	execute,
};
