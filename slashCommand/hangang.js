/**
 * fileName       : hangang.js
 * author         : Yeong-Huns
 * date           : 25. 7. 23.
 * ===========================================================
 * DATE              AUTHOR             NOTE
 * -----------------------------------------------------------
 * 25. 7. 23.        Yeong-Huns       최초 생성
 */
require('dotenv').config();
const {SlashCommandBuilder, EmbedBuilder} = require("discord.js");
const axios = require("axios");
const {getCachedValue, setCachedValue} = require("../config/redis/redisClient");
const {saveCommandLog} = require("../utils/logging");

const riverThumbnails = {
	'중랑천': process.env.JUNGNANGCHEON,
	'탄천': process.env.TANCHEON,
	'안양천': process.env.ANYANGCHEON,
};

/* Command */
const slashCommand =
	new SlashCommandBuilder()
		.setName('수온')
		.setDescription('한강 및 주요지천 수온을 알려줍니다.')
		.addStringOption(option =>
			option
				.setName('하천')
				.setDescription('수온을 알고 싶은 강을 선택하세요.')
				.setRequired(true)
				.addChoices(
					{name: '중랑천', value: '중랑천'},
					{name: '탄천', value: '탄천'},
					{name: '안양천', value: '안양천'}
				)
		);

/* Service */
async function execute(interaction) {
	const redisKey = `hangang`;
	const river = interaction.options.getString('하천');
	try {
		const cached = await getCachedValue(redisKey);
		if (cached) {
			const data = JSON.parse(cached);
			const embed = await makeEmbed(data, river, interaction);
			await interaction.reply({embeds: [embed]});
			return;
		}
		const response = await axios.get(process.env.HANGANG_API);
		const {DATAs: {DATA: {HANGANG}}} = response.data;

		const embed = await makeEmbed(HANGANG, river, interaction);
		await interaction.reply({embeds: [embed]});
		await setCachedValue(redisKey, JSON.stringify(HANGANG), 1800);
		/*로깅*/
		await saveCommandLog(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply("❌ 수온 데이터를 가져오는 중 오류가 발생했어요.");
	}
}

async function makeEmbed(data, river, interaction) {
	const temperatureInfo = data[river];
	if (!temperatureInfo) {
		return await interaction.reply(`❌ ${river}에 대한 수온 정보를 찾을 수 없습니다.`);
	}
	const {TEMP: temp, PH: ph} = temperatureInfo;
	const feeling = getTemperatureFeeling(Number(temp));
	const color = getEmbedColor(Number(temp));
	const thumbnail = riverThumbnails[river];

	return new EmbedBuilder()
		.setTitle(`${river}의 현재 수온`)
		.setColor(color)
		.setDescription(feeling)
		.addFields(
			{name: "온도", value: `${temp}°C`, inline: true},
			{name: "pH", value: `${ph}`, inline: true}
		)
		.setThumbnail(thumbnail)
		.setFooter({
			text: interaction.user.username,
			iconURL: interaction.user.displayAvatarURL({dynamic: true})
		})
}

function getTemperatureFeeling(temp) {
	if (temp <= 15) return "매우 차갑습니다!";
	if (temp <= 20) return "차갑습니다.";
	if (temp <= 26) return "다소 시원합니다.";
	if (temp <= 30) return "입수하기 딱 좋은 수온입니다.";
	return "매우 따뜻합니다. 체온 조절에 주의하세요.";
}

function getEmbedColor(temp) {
	if (temp <= 15) return 0x3498db; /*파랑*/
	if (temp <= 20) return 0x00bfff; /*하늘색*/
	if (temp <= 26) return 0x27ae60; /*초록*/
	if (temp <= 30) return 0xf1c40f; /*노랑*/
	return 0xe74c3c; /*빨강*/
}

module.exports = {
	data: slashCommand,
	execute,
};
