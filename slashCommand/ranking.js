/**
 * fileName       : ranking
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

const guildIcons = new Map();

/* Command */
const slashCommand =
	new SlashCommandBuilder()
		.setName('랭킹')
		.setDescription('게임 잔액 순위표를 보여줍니다')
		.addStringOption(option =>
			option
				.setName('기준')
				.setDescription('기준을 선택해 주세요')
				.setRequired(true)
				.addChoices(
					{name: '전체', value: '전체'},
					{name: '서버', value: '서버'}
				));

/* Service */
const execute = async (interaction) => {
	const criterion = interaction.options.getString('기준');
	const options = criterion == '서버' ? {serverId: interaction.guildId} : {}
	const titleName = criterion == '서버'
		? `${interaction.guild.name} 잔액 순위`
		: '전체 서버 순위';
	const topUsers = await fetchTopUsers(options);
	const footerText = criterion == '서버'
		? '랭킹 : 서버랭킹'
		: '랭킹 : 전체랭킹';

	if (topUsers.length === 0) {
		const embed = new EmbedBuilder()
			.setDescription("**🚨순위 정보가 없습니다.**")
			.setColor(0xe74c3c)
			.setFooter({
				text: '랭킹',
				iconURL: interaction.user.displayAvatarURL({dynamic: true})
			})
		await interaction.reply({embeds: [embed]});
		return;
	}

	const firstUserId = topUsers[0].userId;
	let thumbnailUrl;
	try {
		const firstMember = await interaction.guild.members.fetch(firstUserId);
		thumbnailUrl = firstMember.user.displayAvatarURL({dynamic: true});
	} catch {
		thumbnailUrl = null;
	}

	for (const user of topUsers) {
		if (!guildIcons.has(user.serverId)) {
			const guild = interaction.client.guilds.cache.get(user.serverId);
			const iconUrl = guild ? guild.iconURL({ dynamic: true }) : null;
			const guildName = guild ? guild.name : null;
			guildIcons.set(user.serverId, { guildName, iconUrl });
		}
	}

	const fields = topUsers.map((user, index) => {
		const { guildName, iconUrl } = guildIcons.get(user.serverId);
		const defaultIconUrl = 'https://cdn.discordapp.com/embed/avatars/0.png';
		const iconText = `[${guildName}](${iconUrl || defaultIconUrl })`;

		return `**${index + 1}.<@${user.userId}> - [ ${iconText} ]\n${user.account.toLocaleString('ko-KR')}₩**`
	}).join('\n\n');

	const embed = new EmbedBuilder()
		.setTitle(titleName)
		.setDescription(fields)
		.setColor(0x57f287)
		.setTimestamp()
		.setFooter({text: footerText, iconURL: interaction.user.displayAvatarURL({dynamic: true})});

	if (thumbnailUrl) {
		embed.setThumbnail(thumbnailUrl);
	}

	await interaction.reply({ embeds: [embed] });
	/* 로깅 */
	await saveCommandLog(interaction);
}

async function fetchTopUsers(options = {}) {
	return await User.find(options)
		.sort({account: -1})
		.limit(10)
		.exec();
}

module.exports = {
	data: slashCommand,
	execute,
};