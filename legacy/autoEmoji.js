/**
 * fileName       : autoEmoji
 * author         : Yeong-Huns
 * date           : 2024-10-08
 * ===========================================================
 * DATE              AUTHOR             NOTE
 * -----------------------------------------------------------
 * 2024-10-08        Yeong-Huns       최초 생성
 *
 */
import {EmbedBuilder} from 'discord.js';

export async function detectEmojis(message) {
	const normalEmojis = message.guild.emojis.cache.filter(emoji => !emoji.animated);
	if (!normalEmojis.size) return;

	const usedEmojis = normalEmojis.filter(emoji => message.content.includes(`<:${emoji.name}:${emoji.id}>`));
	if (!usedEmojis.size) return;

	usedEmojis.forEach(async (emoji) => {
		const embed = new EmbedBuilder()
			.setColor(message.member.displayHexColor)
			.setAuthor({
				name: `${message.author.username}`,
				iconURL: message.author.displayAvatarURL(),
			})
			.setImage(emoji.url)
		await message.channel.send({embeds: [embed]});
	});
	try {
		await message.delete();
	} catch (error) {
		console.error('메시지를 삭제하는 중 오류가 발생했습니다:', error);
	}
}

export const name = 'emojidetect';
export const description = '서버에 등록된 이모티콘을 감지하여 임베드 메시지로 출력합니다.';