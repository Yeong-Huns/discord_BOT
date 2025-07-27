/**
 * fileName       : balance
 * author         : Yeong-Huns
 * date           : 25. 7. 27.
 * ===========================================================
 * DATE              AUTHOR             NOTE
 * -----------------------------------------------------------
 * 25. 7. 27.        Yeong-Huns       최초 생성
 */
require('dotenv').config();
const {SlashCommandBuilder, EmbedBuilder} = require("discord.js");
const {User} = require('../schema/user.schema');
const {saveCommandLog} = require("../utils/logging");

/* Command */
const slashCommand =
	new SlashCommandBuilder()
		.setName('잔액')
		.setDescription('잔액을 조회합니다')
		.addUserOption(option =>
			option
				.setName('유저')
				.setDescription('잔액을 조회할 유저를 선택하세요')
				.setRequired(false)
		);

/* Service */
const execute = async (interaction) => {
	const serverId = interaction.guildId;
	let targetUser = interaction.options.getUser('유저') || interaction.user;

	const user = await User.findOne({ userId: targetUser.id, serverId })

	if(!user){
		const embed = new EmbedBuilder()
			.setDescription(`**🚨<@${targetUser.id}> 님이 돈을 받지 않은 유저입니다.\n돈 받는 방법: \`/돈줘\`**`)
			.setColor(0xe74c3c)
			.setFooter({
				text: '잔액',
				iconURL: interaction.user.displayAvatarURL({dynamic: true})
			})
		await interaction.reply({ embeds: [embed] });
		return;
	}

	const embed = new EmbedBuilder()
		.setTitle(`잔액 확인`)
		.setDescription(`**<@${targetUser.id}> 님의 잔액은 ${user.account.toLocaleString('ko-KR')}₩ 입니다**`)
		.setColor(0x57f287)
		.setFooter({
			text: '잔액',
			iconURL: interaction.user.displayAvatarURL({dynamic: true})
		})
		.setTimestamp();

	await interaction.reply({ embeds: [embed] });
	await saveCommandLog(interaction);
}

module.exports = {
	data: slashCommand,
	execute,
};

