/**
 * fileName       : ranking.service
 * author         : Yeong-Huns
 * date           : 25. 7. 28.
 * ===========================================================
 * DATE              AUTHOR             NOTE
 * -----------------------------------------------------------
 * 25. 7. 28.        Yeong-Huns       최초 생성
 */
import {EmbedBuilder} from 'discord.js';
import {User} from '../../schema/user.schema.js';
import {saveCommandLog} from "../../utils/logging.js";

export class RankingService {
	/**
	 * @param {import('discord.js').Interaction} interaction
	 */
	constructor(interaction) {
		this.interaction = interaction;
		this.client = interaction.client;
		this.criterion = interaction.options.getString('기준');
		this.isServerRanking = this.criterion === '서버';
	}

	/**
	 * @desc 랭킹 응답 생성
	 * @returns {Promise<import('discord.js').InteractionReplyOptions>}
	 */
	async createReply() {
		const topUsers = await this._fetchTopUsers();

		if (topUsers.length === 0) {
			return { embeds: [this._createNoResultsEmbed()] };
		}

		const embed = await this._createRankingEmbed(topUsers);

		await saveCommandLog(this.interaction);
		return { embeds: [embed] };
	}

	/**
	 * @desc 랭킹 메세지 생성
	 * @param {Array} topUsers
	 * @private
	 */
	async _createRankingEmbed(topUsers) {
		const title = this.isServerRanking ? `${this.interaction.guild.name} 잔액 순위` : '전체 서버 순위';
		const footer = {
			text: `랭킹 : ${this.criterion}랭킹`,
			iconURL: this.interaction.user.displayAvatarURL({ dynamic: true })
		};

		const [thumbnailUrl, description] = await Promise.all([
			this._getThumbnailUrl(topUsers[0].userId),
			this._formatRankingDescription(topUsers)
		]);

		const embed = new EmbedBuilder()
			.setTitle(title)
			.setDescription(description)
			.setColor(0x57f287)
			.setTimestamp()
			.setFooter(footer);

		if (thumbnailUrl) {
			embed.setThumbnail(thumbnailUrl);
		}

		return embed;
	}

	/**
	 * @desc 랭킹 정보 없음 메세지
	 * @private
	 */
	_createNoResultsEmbed() {
		return new EmbedBuilder()
			.setDescription("**🚨 순위 정보가 없습니다.**")
			.setColor(0xe74c3c)
			.setFooter({
				text: '랭킹',
				iconURL: this.interaction.user.displayAvatarURL({ dynamic: true })
			});
	}

	/**
	 * @desc 상위 유저 목록 fetch
	 * @private
	 */
	_fetchTopUsers() {
		const options = this.isServerRanking ? { serverId: this.interaction.guildId } : {};
		return User.find(options)
			.sort({ account: -1 })
			.limit(10)
			.exec();
	}

	/**
	 * @desc 유저 순위 목록 포맷팅
	 * @param {Array} users
	 * @private
	 */
	_formatRankingDescription(users) {
		return users.map((user, index) => {
			const guild = this.client.guilds.cache.get(user.serverId);
			const guildName = guild ? guild.name : '알 수 없는 서버';
			const iconUrl = guild ? guild.iconURL({ dynamic: true }) : 'https://cdn.discordapp.com/embed/avatars/0.png';

			const serverInfo = `[${guildName}](${iconUrl})`;
			const userAccount = user.account.toLocaleString('ko-KR');

			return `**${index + 1}. <@${user.userId}> - [ ${serverInfo} ]\n${userAccount}₩**`;
		}).join('\n\n');
	}

	/**
	 * @desc 1위 유저 썸네일 URL
	 * @param {string} userId
	 * @private
	 */
	async _getThumbnailUrl(userId) {
		try {
			const topUserMember = await this.interaction.guild.members.fetch(userId);
			return topUserMember.user.displayAvatarURL({ dynamic: true });
		} catch (error) {
			console.error('썸네일 유저 정보를 가져오는 데 실패했습니다:', error);
			return null;
		}
	}
}