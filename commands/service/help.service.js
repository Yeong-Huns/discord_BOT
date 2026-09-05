/**
 * fileName       : help.service
 * author         : Yeong-Huns
 * date           : 25. 8. 1.
 * ===========================================================
 * DATE              AUTHOR             NOTE
 * -----------------------------------------------------------
 * 25. 8. 1.        Yeong-Huns       최초 생성
 */
import {EmbedBuilder} from "discord.js";

export class HelpService {
	/**
	 * @param {import('discord.js').Interaction} interaction
	 */
	constructor(interaction) {
		this.interaction = interaction;
	}

	/**
	 * @desc 도움말 응답 생성
	 */
	async createReply() {
		const embed = this._createHelpEmbed();
		return { embeds: [embed] };
	}

	/**
	 * @desc 도움말 메세지 생성
	 * @private
	 */
	_createHelpEmbed() {
		/* 슬래시(/) 명령어 */
		const slashCommands = [
			{ name: '\n`/도움말`', value: '\n명령어를 출력합니다.' },
			{ name: '`/핑`', value: '\n서버의 상태를 확인합니다.' },
			{ name: '`/콘`', value: '\n서버에 등록된 정적 이모지를 출력합니다.' },
			{ name: '`/움짤`', value: '\n서버에 등록된 GIF 이모지를 출력합니다.' },
			{ name: '`/음성`', value: '\n음성채널에서 TTS를 지원합니다.' },
			{ name: '`/나가`', value: '\n음성채널에서 나갑니다.' },
			{ name: '`/청소`', value: '\n다량의 메시지를 삭제합니다.' },
			{ name: '`/수온`', value: '\n주요 지천의 수온을 확인합니다.' },
			{ name: '`/랭킹`', value: '\n게임 잔액 순위표를 보여줍니다.' },
			{ name: '`/잔액`', value: '\n잔액을 확인합니다.' },
			{ name: '`/돈줘`', value: '\n게임을 하기 위한 돈을 받습니다.' },
			{ name: '`/송금`', value: '\n다른 유저에게 돈을 보냅니다.' },
			{ name: '`/도박`', value: '\n돈을 걸고 도박을 합니다.' },
		];

		const slashText = slashCommands.map(it => `${it.name} : ${it.value}`).join('\n\n');

		return new EmbedBuilder()
			.setColor(0x0099FF)
			.setTitle('🪄  명령어 안내\n')
			.addFields(
				{ name: '\n슬래시(`/`) 커맨드\n', value: slashText || '없음', inline: true }
			)
			.setFooter({
				text: '도움말',
				iconURL: this.interaction.user.displayAvatarURL({ dynamic: true })
			})
			.setTimestamp();
	}
}