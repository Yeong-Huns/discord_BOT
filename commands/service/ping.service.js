/**
 * fileName       : ping.service
 * author         : Yeong-Huns
 * date           : 26. 8. 22.
 * ===========================================================
 * DATE              AUTHOR             NOTE
 * -----------------------------------------------------------
 * 26. 8. 22.        Yeong-Huns       최초 생성
 */
import {EmbedBuilder} from "discord.js";

export class PingService {
	/**
	 * @param {import('discord.js').Interaction} interaction
	 */
	constructor(interaction) {
		this.interaction = interaction;
	}

	/**
	 * @desc 핑 응답 생성
	 */
	async createReply() {
		const embed = new EmbedBuilder()
			.setColor(0x57f287)
			.setTitle('🏓 퐁!')
			.setDescription(`**API 지연시간 : ${Math.max(this.interaction.client.ws.ping, 0)}ms**`)
			.setTimestamp();
		return { embeds: [embed] };
	}
}
