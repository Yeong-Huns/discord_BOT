/**
 * fileName       : gamble.js
 * author         : Yeong-Huns
 * date           : 25. 7. 22.
 * ===========================================================
 * DATE              AUTHOR             NOTE
 * -----------------------------------------------------------
 * 25. 7. 22.        Yeong-Huns       최초 생성
 */

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('도박')
		.setDescription('돈을 걸고 도박을 합니다')
		.addIntegerOption(option =>
			option.setName('금액')
				.setDescription('배팅할 금액을 입력하세요.')
				.setRequired(true)
		),
	async execute(interaction) {
		const amount = interaction.options.getInteger("금액");

		// 결과 로직
		const winRate = Math.floor(Math.random() * 51) + 30;
		const resultChance = Math.floor(Math.random() * 100) + 1;
		const isWin = resultChance <= winRate;

		const formattedAmount = amount.toLocaleString('ko-KR');
		const displayAmount = `${isWin ? '+' : '-'}${formattedAmount}₩`;

		const resultText = isWin ? '도박에 성공했어요' : '도박에 실패했어요';
		const color = isWin ? 0x57f287 : 0xed4245;

		const embed = new EmbedBuilder()
			.setColor(color)
			.setTitle(resultText)
			.setDescription(`승리 확률 : ${winRate}%\n\n**결과 : ${displayAmount}**`)
			.setFooter({
				text: `${interaction.user.username}`,
				iconURL: interaction.user.displayAvatarURL({ dynamic: true })
			})

		await interaction.reply({ embeds: [embed] });
	},
};