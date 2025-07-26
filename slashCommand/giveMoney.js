/**
 * fileName       : giveMoney
 * author         : Yeong-Huns
 * date           : 25. 7. 26.
 * ===========================================================
 * DATE              AUTHOR             NOTE
 * -----------------------------------------------------------
 * 25. 7. 26.        Yeong-Huns       최초 생성
 */

require('dotenv').config();
const { SlashCommandBuilder, EmbedBuilder} = require("discord.js");
const { User } = require('../schema/userSchema');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('돈줘')
		.setDescription('게임을 하기 위한 돈을 받습니다.'),
	async execute(interaction) {
		const userId = interaction.user.id;
		const serverId = interaction.guildId;
		const now = new Date();

		let user = await User.findOne({ userId, serverId});

		if(!user){
			user = new User({
				userId,
				serverId,
				account: 0,
				lastDeposit: null,
			});
		}

		if(user.lastDeposit){
			const lastDate = new Date(user.lastDeposit);
			const isSameDay = now.toISOString().slice(0,10) === lastDate.toISOString().slice(0,10);
			if(isSameDay)
				return await interaction.reply({
					content: "🚨 이미 오늘 돈을 받으셨습니다",
					ephemeral: true,
				})
		}

		user.account += 10000;
		user.lastDeposit = now;
		await user.save();

		const embed = new EmbedBuilder()
			.setTitle('입금 완료')
			.setDescription(`10,000₩을 드렸어요\n\n잔액 : ${user.account.toLocaleString('ko-KR', { style: 'currency', currency: 'KRW' })}`)
			.setColor(0x27ae60)
			.setFooter({
				text: interaction.user.username,
				iconURL: interaction.user.displayAvatarURL({dynamic: true})
			})

		await interaction.reply({ embeds: [embed] });
	}
}