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
const { User } = require('../schema/userSchema');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('도박')
		.setDescription('돈을 걸고 도박을 합니다')
		.addIntegerOption(option =>
			option.setName('금액')
				.setDescription('배팅할 금액을 입력하세요.')
				.setRequired(true)
				.setMinValue(500)
		),
	async execute(interaction) {
		const userId = interaction.user.id;
		const serverId = interaction.guildId;
		const amount = interaction.options.getInteger("금액");

		const user = await User.findOne({ userId, serverId});

		if(!user){
			const embed = new EmbedBuilder()
				.setDescription("**🚨`/돈줘`커맨드를 통해 먼저 돈을 받아주세요.**")
				.setColor(0xe74c3c)
				.setFooter({
					text: '도박',
					iconURL: interaction.user.displayAvatarURL({dynamic: true})
				})
			await interaction.reply({ embeds: [embed] });
			return;
		}

		const hasMoney = user.account >= amount;

		if(!hasMoney){
			const embed = new EmbedBuilder()
				.setDescription("**🚨돈이 부족합니다**")
				.setColor(0xe74c3c)
				.setFooter({
					text: '도박',
					iconURL: interaction.user.displayAvatarURL({dynamic: true})
				})
			await interaction.reply({ embeds: [embed] });
			return;
		}

		const n = Math.random() ** 1.5;
		const winRate = Math.floor(n * 41) + 30;
		const resultChance = Math.floor(Math.random() * 100) + 1;
		const isWin = resultChance <= winRate;

		const formattedAmount = amount.toLocaleString('ko-KR');
		const displayAmount = `${isWin ? '+' : '-'}${formattedAmount}₩`;

		const resultText = isWin ? '도박에 성공했어요' : '도박에 실패했어요';
		const color = isWin ? 0x57f287 : 0xed4245;
		isWin ? user.account += amount : user.account -= amount;
		await user.save();

		const embed = new EmbedBuilder()
			.setColor(color)
			.setTitle(resultText)
			.setDescription(`**승리 확률 : ${winRate}%\n\n결과 : ${displayAmount}**`)
			.setFooter({
				text: `잔액 : ${user.account.toLocaleString('ko-KR', { style: 'currency', currency: 'KRW' })}`,
				iconURL: interaction.user.displayAvatarURL({ dynamic: true })
			})

		await interaction.reply({ embeds: [embed] });
	},
};