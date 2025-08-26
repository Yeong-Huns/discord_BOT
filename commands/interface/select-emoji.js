/**
 * fileName       : select-emoji
 * author         : Yeong-Huns
 * date           : 25. 7. 29.
 * ===========================================================
 * DATE              AUTHOR             NOTE
 * -----------------------------------------------------------
 * 25. 7. 29.        Yeong-Huns       최초 생성
 */
import {SlashCommandBuilder} from "discord.js";
import {SelectEmojiService} from "../service/select-emoji.service.js";
import {saveCommandLog} from "../../utils/logging.js";
import {errorReply} from "../../utils/error-reply.js";

/* Command */
const slashCommand = new SlashCommandBuilder()
	.setName('콘')
	.setDescription('서버에 등록된 정적 이모지를 출력합니다.');

/* Service */
const execute = async (interaction) => {
	try {
		const emojiService = new SelectEmojiService(interaction);
		await emojiService.sendSelector();
		await saveCommandLog(interaction);
	} catch (error) {
		await errorReply(interaction, error, '`/콘`');
	}
};

export default {
	data: slashCommand,
	execute,
};

