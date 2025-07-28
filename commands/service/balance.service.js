/**
 * fileName       : balance.service
 * author         : Yeong-Huns
 * date           : 25. 7. 28.
 * ===========================================================
 * DATE              AUTHOR             NOTE
 * -----------------------------------------------------------
 * 25. 7. 28.        Yeong-Huns       최초 생성
 */
import {EmbedBuilder} from "discord.js";
import {User} from '../../schema/user.schema.js'
import {saveCommandLog} from "../../utils/logging.js";

export class BalanceService {
	/**
	 * @param {import('discord.js').CommandInteraction} interaction
	 */
	constructor(interaction) {
		this.interaction = interaction;
		this.serverId = interaction.guildId;
		this.targetUser = interaction.options.getUser('유저') || interaction.user;
	}

	/**
	 * @desc 잔액 조회 응답 생성
	 * @returns {Promise<import('discord.js').InteractionReplyOptions>}
	 */
	async createReply() {
		const user = await User.findOne({ userId: this.targetUser.id, serverId: this.serverId });

		if (!user) {
			return { embeds: [this._createNoBalanceEmbed()] };
		}

		await saveCommandLog(this.interaction);
		return { embeds: [this._createBalanceEmbed(user)] };
	}

	/**
	 * @desc 잔액 정보가 없는 경우
	 * @private
	 */
	_createNoBalanceEmbed() {
		return new EmbedBuilder()
			.setDescription(`**🚨<@${this.targetUser.id}> 님이 돈을 받지 않은 유저입니다.\n돈 받는 방법: \`/돈줘\`**`)
			.setColor(0xe74c3c)
			.setFooter({
				text: '잔액',
				iconURL: this.interaction.user.displayAvatarURL({ dynamic: true })
			});
	}

	/**
	 * @desc 잔액 정보가 있는 경우
	 * @param {Object} user
	 * @private
	 */
	_createBalanceEmbed(user) {
		return new EmbedBuilder()
			.setTitle(`잔액 확인`)
			.setDescription(`**<@${this.targetUser.id}> 님의 잔액은 ${user.account.toLocaleString('ko-KR')}₩ 입니다**`)
			.setColor(0x57f287)
			.setFooter({
				text: '잔액',
				iconURL: this.interaction.user.displayAvatarURL({ dynamic: true })
			})
			.setTimestamp();
	}
}