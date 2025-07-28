/**
 * fileName       : gamble.service
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

export class GambleService {
	/**
	 * @param {import('discord.js').CommandInteraction} interaction
	 */
	constructor(interaction) {
		this.interaction = interaction;
		this.userId = interaction.user.id;
		this.serverId = interaction.guildId;
		this.amount = interaction.options.getInteger("금액");
	}

	/**
	 * @desc 응답 생성
	 * @returns {Promise<import('discord.js').InteractionReplyOptions>}
	 */
	async createReply() {
		const user = await User.findOne({userId: this.userId, serverId: this.serverId});

		if (!user) {
			return {embeds: [this._createNoBalanceEmbed()]};
		}

		if (user.account < this.amount) {
			return {embeds: [this._createInsufficientMoneyEmbed()]};
		}

		const { isWin, winRate, displayAmount } = this._calculateGamblingResult();

		isWin ? user.account += this.amount : user.account -= this.amount;

		try {
			await user.save();
		} catch (error) {
			if (error.name === 'VersionError') {
				return { embeds: [this._createVersionErrorEmbed()] };
			}
			/* 버전키 충돌이 아닐경우 */
			throw error;
		}

		await saveCommandLog(this.interaction, {
			optionAmount: this.amount,
			userBalance: user.account
		})

		return { embeds: [this._createResultEmbed(user, isWin, winRate, displayAmount)] };
	}

	/**
	 * @desc 계좌 개설 전 메세지
	 * @private
	 */
	_createNoBalanceEmbed() {
		return new EmbedBuilder()
			.setDescription("**🚨`/돈줘`커맨드를 통해 먼저 돈을 받아주세요.**")
			.setColor(0xe74c3c)
			.setFooter({
				text: '도박',
				iconURL: this.interaction.user.displayAvatarURL({dynamic: true})
			})
	}

	/**
	 * @desc 잔액 부족 메세지
	 * @private
	 */
	_createInsufficientMoneyEmbed() {
		return new EmbedBuilder()
			.setDescription("**🚨돈이 부족합니다**")
			.setColor(0xe74c3c)
			.setFooter({
				text: '도박',
				iconURL: this.interaction.user.displayAvatarURL({dynamic: true})
			})
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
				text: '문제가 발생한 커맨드 : `/도박`',
				iconURL: this.interaction.user.displayAvatarURL({ dynamic: true })
			});
	}

	/**
	 * @desc 최종 도박 결과 메세지
	 * @param {Object} user - 업데이트된 User 객체
	 * @param {boolean} isWin - 승리 여부
	 * @param {number} winRate - 계산된 승리 확률
	 * @param {string} displayAmount - 표시될 금액 (예: +1,000₩)
	 * @private
	 */
	_createResultEmbed(user, isWin, winRate, displayAmount) {
		const resultText = isWin ? '도박에 성공했어요' : '도박에 실패했어요';
		const color = isWin ? 0x57f287 : 0xed4245;

		return new EmbedBuilder()
			.setColor(color)
			.setTitle(resultText)
			.setDescription(`**승리 확률 : ${winRate}%\n\n결과 : ${displayAmount}**`)
			.setFooter({
				text: `잔액 : ${user.account.toLocaleString('ko-KR', {style: 'currency', currency: 'KRW'})}`,
				iconURL: this.interaction.user.displayAvatarURL({dynamic: true})
			});
	}

	/**
	 * @desc 확률 계산 로직
	 * @returns {{isWin: boolean, winRate: number, displayAmount: string}}
	 * @private
	 */
	_calculateGamblingResult() {
		const n = Math.random() ** 1.9;
		const winRate = Math.floor(n * 41) + 30;
		const resultChance = Math.floor(Math.random() * 100) + 1;
		const isWin = resultChance <= winRate;

		const formattedAmount = this.amount.toLocaleString('ko-KR');
		const displayAmount = `${isWin ? '+' : '-'}${formattedAmount}₩`;

		return {isWin, winRate, displayAmount};
	}
}