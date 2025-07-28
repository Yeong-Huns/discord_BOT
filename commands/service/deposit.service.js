/**
 * fileName       : deposit-service
 * author         : Yeong-Huns
 * date           : 25. 7. 28.
 * ===========================================================
 * DATE              AUTHOR             NOTE
 * -----------------------------------------------------------
 * 25. 7. 28.        Yeong-Huns       최초 생성
 */
import { EmbedBuilder } from "discord.js";
import { User } from '../../schema/user.schema.js'
import convertDate from "../../utils/convert-date.js";
import { saveCommandLog } from "../../utils/logging.js";

export class DepositService {
	/**
	 * @param {import('discord.js').CommandInteraction} interaction
	 */
	constructor(interaction) {
		this.interaction = interaction;
		this.userId = interaction.user.id;
		this.serverId = interaction.guildId;
		this.depositAmount = 10000;
		this.now = new Date();
	}

	/**
	 * @desc '돈 줘' 응답 생성
	 * @returns {Promise<import('discord.js').InteractionReplyOptions>}
	 */
	async createReply() {
		let user = await User.findOne({ userId: this.userId, serverId: this.serverId });

		if (!user) {
			user = new User({
				userId: this.userId,
				serverId: this.serverId,
				account: 0,
				lastDeposit: null,
			});
		}

		if (user.lastDeposit) {
			const lastDepositDate = new Date(user.lastDeposit);
			const isSameDay = convertDate(this.now) === convertDate(lastDepositDate);
			if (isSameDay) {
				return { embeds: [this._createAlreadyDepositedEmbed()] };
			}
		}

		user.account += this.depositAmount;
		user.lastDeposit = this.now;

		try {
			await user.save();
		} catch (error) {
			if (error.name === 'VersionError') {
				return { embeds: [this._createVersionErrorEmbed()] };
			}
			throw error;
		}

		await saveCommandLog(this.interaction, {
			optionAmount: Number(10000),
			userBalance: user.account
		});
		return { embeds: [this._createDepositSuccessEmbed(user)] };
	}

	/**
	 * @desc 이미 돈을 받음 메세지
	 * @private
	 */
	_createAlreadyDepositedEmbed() {
		return new EmbedBuilder()
			.setDescription("**🚨 이미 오늘 돈을 받으셨습니다**")
			.setColor(0xe74c3c)
			.setFooter({
				text: '돈줘',
				iconURL: this.interaction.user.displayAvatarURL({ dynamic: true })
			});
	}

	/**
	 * @desc version error 발생 메세지
	 * @private
	 */
	_createVersionErrorEmbed() {
		return new EmbedBuilder()
			.setTitle('버전키 충돌')
			.setDescription("**🚨 너무 빠르게 시도하고 있습니다**")
			.setColor(0xe74c3c)
			.setFooter({
				text: '문제가 발생한 커맨드 : `/돈줘`',
				iconURL: this.interaction.user.displayAvatarURL({ dynamic: true })
			});
	}

	/**
	 * @desc 돈 지급 성공 메세지
	 * @param {Object} user
	 * @private
	 */
	_createDepositSuccessEmbed(user) {
		return new EmbedBuilder()
			.setTitle('돈 지급 (하루에 한번 가능)')
			.setDescription(`**${this.depositAmount.toLocaleString('ko-KR')}₩을 드렸어요\n\n잔액 : ${user.account.toLocaleString('ko-KR', { style: 'currency', currency: 'KRW' })}**`)
			.setColor(0x27ae60)
			.setFooter({
				text: this.interaction.user.username,
				iconURL: this.interaction.user.displayAvatarURL({ dynamic: true })
			});
	}
}