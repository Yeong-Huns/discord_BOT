import {EmbedBuilder} from "discord.js";
import {User} from "../../schema/user.schema.js";

/**
 * fileName       : transfer.service
 * author         : Yeong-Huns
 * date           : 25. 7. 29.
 * ===========================================================
 * DATE              AUTHOR             NOTE
 * -----------------------------------------------------------
 * 25. 7. 29.        Yeong-Huns       최초 생성
 */
export class TransferService {
	/**
	 * @param {import('discord.js').CommandInteraction} interaction
	 */
	constructor(interaction) {
		this.interaction = interaction;
		this.sender = interaction.user;
		this.recipient = interaction.options.getUser('유저');
		this.amount = interaction.options.getInteger('송금액');
		this.serverId = interaction.guildId;
	}

	/**
	 * @desc 송금 명령어 처리 및 응답 반환
	 * @returns {Promise<import('discord.js').InteractionReplyOptions>}
	 */
	async createReply() {
		/* 기본 유효성 검사 */
		if (this.sender.id === this.recipient.id) return this._createErrorReply('SELF_TRANSFER');
		if (this.recipient.bot) return this._createErrorReply('TRANSFER_TO_BOT');
		if (this.amount <= 0) return this._createErrorReply('INVALID_AMOUNT');

		const maxRetries = 3; /* 낙관적 락 최대 시도 횟수 */
		for (let i = 0; i < maxRetries; i++) {
			try {
				const [senderData, recipientData] = await Promise.all([
					User.findOne({userId: this.sender.id, serverId: this.serverId}),
					User.findOne({userId: this.recipient.id, serverId: this.serverId})
				]);

				/* 송금자 validation */
				if (!senderData) return this._createErrorReply('SENDER_NO_USER');
				if (senderData.account < this.amount) return this._createErrorReply('INSUFFICIENT_FUNDS', {userBalance: senderData.account});

				/* 수신자 Data -> 없으면 새로 생성 */
				const recipientUser = recipientData || new User({
					userId: this.recipient.id,
					serverId: this.serverId,
					account: 0
				});

				const senderOldBalance = senderData.account;
				const recipientOldBalance = recipientUser.account;

				senderData.account -= this.amount;
				recipientUser.account += this.amount;

				await Promise.all([senderData.save(), recipientUser.save()]);

				return {embeds: [this._createSuccessEmbed(senderData, recipientUser)]};

			} catch (error) {
				if (error.name === 'VersionError') {
					console.log(`[TransferService] VersionError 발생 (${i + 1} / 3 번째 시도)`);
				} else {
					throw error;
				}
			}
		}

		console.error(`[TransferService] 송금 실패: 최대 재시도 횟수(${maxRetries}회) 초과`);
		return this._createErrorReply('MAX_RETRIES_EXCEEDED');
	}

	/**
	 * @desc 오류 메세지 분기처리
	 * @private
	 */
	async _createErrorReply(reason) {
		let description = '';
		switch (reason) {
			case 'SELF_TRANSFER':
				description = '**🚨 자기 자신에게 송금할 수 없습니다.**';
				break;
			case 'TRANSFER_TO_BOT':
				description = '**🚨 봇에게는 송금할 수 없습니다.**';
				break;
			case 'INVALID_AMOUNT':
				description = '**🚨 송금액은 1000 이상의 숫자여야 합니다.**';
				break;
			case 'SENDER_NO_USER':
				description = '**🚨 `/돈줘` 명령어로 먼저 돈을 받아주세요.**';
				break;
			case 'INSUFFICIENT_FUNDS':
				description = '**🚨 잔액이 부족합니다.**';
				break;
			case 'MAX_RETRIES_EXCEEDED':
				description = '**🚨 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.**';
				break;
		}

		const embed = new EmbedBuilder()
			.setDescription(description)
			.setColor(0xe74c3c);

		return {embeds: [embed], ephemeral: true};
	}

	/**
	 * @desc 송금 성공 메세지
	 * @param {Object} senderData - 송금자 data
	 * @param {Object} recipientData - 수신자 data
	 * @private
	 */
	_createSuccessEmbed(senderData, recipientData) {
		const description = `**<@${this.sender.id}> (송금자)**\n` +
			`**잔액: ${senderData.account.toLocaleString('ko-KR')}₩**\n` +
			`**<@${this.recipient.id}> (송금 받은 사람)**\n` +
			`**잔액: ${recipientData.account.toLocaleString('ko-KR')}₩**`;
		return new EmbedBuilder()
			.setTitle(`송금 완료 (${this.amount.toLocaleString('ko-KR')}₩)`)
			.setColor(0x57f287)
			.setDescription(description)
			.setThumbnail(this.recipient.displayAvatarURL({ dynamic: true }) ?? 'https://cdn.discordapp.com/embed/avatars/0.png')
			.setFooter({
				text: '송금',
				iconURL: this.interaction.user.displayAvatarURL({ dynamic: true })
			})
			.setTimestamp();
	}
}