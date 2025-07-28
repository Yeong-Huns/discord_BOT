/**
 * fileName       : water-temperature.service
 * author         : Yeong-Huns
 * date           : 25. 7. 28.
 * ===========================================================
 * DATE              AUTHOR             NOTE
 * -----------------------------------------------------------
 * 25. 7. 28.        Yeong-Huns       최초 생성
 */
import {EmbedBuilder} from "discord.js";
import axios from "axios";
import {getCachedValue, setCachedValue} from "../../config/redis/redis-client.js";
import {saveCommandLog} from "../../utils/logging.js";

const riverThumbnails = {
	'중랑천': process.env.JUNGNANGCHEON,
	'탄천': process.env.TANCHEON,
	'안양천': process.env.ANYANGCHEON,
};

export class WaterTemperatureService {
	/**
	 * @param {import('discord.js').CommandInteraction} interaction
	 */
	constructor(interaction) {
		this.interaction = interaction;
		this.river = interaction.options.getString('하천');
		this.redisKey = `hangang_temp_${this.river}`;
	}

	/**
	 * @desc 수온 응답 생성
	 * @returns {Promise<import('discord.js').InteractionReplyOptions>}
	 */
	async createReply(){
		let temperatureData;

		try {
			const cached = await getCachedValue(this.redisKey);
			if (cached) {
				temperatureData = JSON.parse(cached);
			} else {
				const response = await axios.get(process.env.HANGANG_API);
				const allRiverData = response.data.DATAs.DATA.HANGANG;

				for (const riverName in allRiverData) {
					if (Object.hasOwnProperty.call(allRiverData, riverName)) {
						await setCachedValue(`hangang_temp_${riverName}`, JSON.stringify(allRiverData[riverName]), 900);
					}
				}
				temperatureData = allRiverData[this.river];
			}

			/**/
			if (!temperatureData) {
				return { content: `❌ ${this.river}에 대한 수온 정보를 찾을 수 없습니다.`, ephemeral: true };
			}

			const embed = this._makeEmbed(temperatureData);

			await saveCommandLog(this.interaction);
			return { embeds: [embed] };
		} catch (error) {
			throw error;
		}
	}

	/**
	 * @desc 수온 정보 메세지
	 * @param {Object} data
	 * @returns {EmbedBuilder}
	 * @private
	 */
	_makeEmbed(data) {
		const { TEMP: temp, PH: ph } = data;
		const feeling = this._getTemperatureFeeling(Number(temp));
		const color = this._getEmbedColor(Number(temp));
		const thumbnail = riverThumbnails[this.river];

		return new EmbedBuilder()
			.setTitle(`${this.river}의 현재 수온`)
			.setColor(color)
			.setDescription(feeling)
			.addFields(
				{ name: "온도", value: `${temp}°C`, inline: true },
				{ name: "pH", value: `${ph}`, inline: true }
			)
			.setThumbnail(thumbnail)
			.setFooter({
				text: this.interaction.user.username,
				iconURL: this.interaction.user.displayAvatarURL({ dynamic: true })
			});
	}

	/**
	 * @desc 온도에 따른 메세지 설정
	 * @param {number} temp - 온도
	 * @returns {string}
	 * @private
	 */
	_getTemperatureFeeling(temp) {
		if (temp <= 15) return "매우 차갑습니다!";
		if (temp <= 20) return "차갑습니다.";
		if (temp <= 26) return "다소 시원합니다.";
		if (temp <= 30) return "입수하기 딱 좋은 수온입니다.";
		return "매우 따뜻합니다. 체온 조절에 주의하세요.";
	}

	/**
	 * @param {number} temp - 온도
	 * @returns {number} - 임베드 메세지 색상
	 * @private
	 */
	_getEmbedColor(temp) {
		if (temp <= 15) return 0x3498db; /*파랑*/
		if (temp <= 20) return 0x00bfff; /*하늘색*/
		if (temp <= 26) return 0x27ae60; /*초록*/
		if (temp <= 30) return 0xf1c40f; /*노랑*/
		return 0xe74c3c; /*빨강*/
	}
}
