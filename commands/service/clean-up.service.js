/**
 * fileName       : clean-up.servce
 * author         : Yeong-Huns
 * date           : 25. 7. 31.
 * ===========================================================
 * DATE              AUTHOR             NOTE
 * -----------------------------------------------------------
 * 25. 7. 31.        Yeong-Huns       최초 생성
 */

import { EmbedBuilder, PermissionsBitField } from "discord.js";
import { saveCommandLog } from "../../utils/logging.js";

export class CleanService {
	/**
	 * @param {import('discord.js').CommandInteraction} interaction
	 */
	constructor(interaction) {
		this.interaction = interaction;
		this.channel = interaction.channel;
		this.amount = interaction.options.getInteger('갯수');
	}

	/**
	 * @desc 청소 명령어 처리 및 응답
	 */
	async processCleaning() {
		/* 사용자 권한 validation */
		if (!this.interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
			return this._createErrorReply('NO_USER_PERMISSION');
		}

		/* 봇 권한 validation */
		if (!this.interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
			return this._createErrorReply('NO_BOT_PERMISSION');
		}

		try {
			const deletedMessages = await this.channel.bulkDelete(this.amount, true);
			const deletedCount = deletedMessages.size;

			await saveCommandLog(this.interaction);

			return { embeds: [this._createSuccessEmbed(deletedCount)], ephemeral: true };
		} catch (error) {
			console.error('[CleanService] 메세지 삭제중 오류 발생:', error);
			return this._createErrorReply('BULK_DELETE_ERROR', { errorMessage: error.message });
		}
	}

	/**
	 * @desc 오류 메세지 분기처리
	 * @private
	 */
	async _createErrorReply(reason, logData = {}) {
		let description = '';
		switch (reason) {
			case 'NO_USER_PERMISSION':
				description = '**🚨 이 명령어를 사용하려면 메시지 관리 권한이 필요합니다.**';
				break;
			case 'NO_BOT_PERMISSION':
				description = '**🚨 봇에게 메시지 관리 권한이 없습니다.**\n서버 설정에서 봇의 권한을 확인해주세요.';
				break;
			case 'BULK_DELETE_ERROR':
				description = '**🚨 메시지를 삭제하는 중 오류가 발생했습니다.**\n14일이 지난 메시지는 대량으로 삭제할 수 없습니다.';
				break;
		}

		const embed = new EmbedBuilder()
			.setDescription(description)
			.setColor(0xe74c3c);

		return { embeds: [embed], ephemeral: true };
	}

	/**
	 * @desc 청소 성공 메세지 생성
	 * @private
	 */
	_createSuccessEmbed(count) {
		return new EmbedBuilder()
			.setColor(0x57f287)
			.setDescription(`**✅ ${count}개의 메시지를 성공적으로 삭제했습니다.**`);
	}
}