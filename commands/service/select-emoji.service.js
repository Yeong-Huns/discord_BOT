/**
 * fileName       : select-emoji.service
 * author         : Yeong-Huns
 * date           : 25. 7. 29.
 * ===========================================================
 * DATE              AUTHOR             NOTE
 * -----------------------------------------------------------
 * 25. 7. 29.        Yeong-Huns       최초 생성
 *//**
 * fileName       : select-emoji.service
 * author         : Yeong-Huns
 * date           : 25. 7. 29.
 * ===========================================================
 * DATE              AUTHOR             NOTE
 * -----------------------------------------------------------
 * 25. 7. 29.        Yeong-Huns       최초 생성
 */
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags } from 'discord.js';

const PAGE_SIZE = 20; /* 한 페이지 이모지 갯수 */

export class SelectEmojiService {
	/**
	 * @param {import('discord.js').Interaction} interaction
	 */
	constructor(interaction) {
		this.interaction = interaction;
		this.emojis = [];
	}

	/**
	 * @desc 이모지 선택창 생성
	 */
	async sendSelector() {
		await this._fetchAndFilterEmojis();

		if (this.emojis.length === 0) {
			await this.interaction.reply({ content: '❌ 서버에 등록된 이모지가 없습니다.', flags: MessageFlags.Ephemeral });
			return;
		}

		let currentPage = 1;
		const totalPages = Math.ceil(this.emojis.length / PAGE_SIZE);

		const getComponents = () => this._generateComponents(currentPage, totalPages);

		await this.interaction.reply({
			components: getComponents(),
		});

		const fetchedMessage = await this.interaction.fetchReply();

		const collector = fetchedMessage.createMessageComponentCollector({
			/* 명령어를 실행한 유저만 상호작용 가능하도록 필터링 */
			filter: (i) => i.user.id === this.interaction.user.id,
			/* 타임아웃 :: 3분으로 단축 (토큰 만료 방지) */
			time: 3 * 60 * 1000,
		});

		collector.on('collect', async (i) => {
			try {
				if (!i.deferred && !i.replied) {
					await i.deferUpdate();
				}

				const customId = i.customId;

				/* 페이지네이션 처리 */
				if (customId === 'emoji_prev_page' && currentPage > 1) {
					currentPage--;
					await this.interaction.editReply({ components: getComponents() });
					return;
				} else if (customId === 'emoji_next_page' && currentPage < totalPages) {
					currentPage++;
					await this.interaction.editReply({ components: getComponents() });
					return;
				}

				if (customId.startsWith('send_emoji_')) {
					const emojiId = customId.split('_')[2];
					const selectedEmoji = this.interaction.guild.emojis.cache.get(emojiId);

					if (selectedEmoji) {
						const finalEmbed = this._createFinalEmojiEmbed(selectedEmoji);
						await this.interaction.editReply({ embeds: [finalEmbed], components: [] });
					} else {
						await i.followUp({ content: '❌ 해당 이모지를 찾을 수 없습니다.', flags: MessageFlags.Ephemeral });
					}
					collector.stop();
				}
			} catch (error) {
				console.error('버튼 상호작용 처리 중 오류:', error);
				// 오류 발생 시 컬렉터 종료
				collector.stop();
			}
		});

		/* 타임아웃 이벤트 리스너 */
		collector.on('end', async (collected, reason) => {
			if (reason === 'time') {
				try {
					const disabledComponents = getComponents().map(row => {
						row.components.forEach(button => button.setDisabled(true));
						return row;
					});
					await this.interaction.editReply({
						content: '❌ 시간이 만료되었습니다.',
						components: disabledComponents
					});
				} catch (error) {
					console.error('타임아웃 처리 중 오류:', error);
				}
			}
		});
	}

	/**
	 * 정적 이모지 필터링
	 * @private
	 */
	async _fetchAndFilterEmojis() {
		const emojiList = await this.interaction.guild.emojis.fetch();
		this.emojis = Array.from(emojiList.filter(emoji => !emoji.animated).values());
	}

	/**
	 * 페이지에 맞는 아이콘을 가져옴
	 * @param {number} currentPage
	 * @param {number} totalPages
	 * @private
	 */
	_generateComponents(currentPage, totalPages) {
		const start = (currentPage - 1) * PAGE_SIZE;
		const end = start + PAGE_SIZE;
		const pageEmojis = this.emojis.slice(start, end);

		const rows = [];
		for (let i = 0; i < Math.ceil(pageEmojis.length / 5); i++) {
			rows.push(new ActionRowBuilder());
		}

		pageEmojis.forEach((emoji, index) => {
			const rowIndex = Math.floor(index / 5); /* 현재 이모지가 속할 행의 인덱스 */
			rows[rowIndex].addComponents(
				new ButtonBuilder()
					.setCustomId(`send_emoji_${emoji.id}`)
					.setStyle(ButtonStyle.Secondary)
					.setEmoji({ id: emoji.id, animated: emoji.animated })
			);
		});

		if (totalPages > 1) {
			rows.push(
				new ActionRowBuilder().addComponents(
					new ButtonBuilder()
						.setCustomId('emoji_prev_page')
						.setLabel('◀ 이전')
						.setStyle(ButtonStyle.Primary)
						.setDisabled(currentPage === 1),
					new ButtonBuilder()
						.setCustomId('page_indicator')
						.setLabel(`${currentPage} / ${totalPages}`)
						.setStyle(ButtonStyle.Secondary)
						.setDisabled(true),
					new ButtonBuilder()
						.setCustomId('emoji_next_page')
						.setLabel('다음 ▶')
						.setStyle(ButtonStyle.Primary)
						.setDisabled(currentPage === totalPages)
				)
			);
		}
		return rows;
	}

	/**
	 * 최종 메시지 Embed 생성
	 * @param {import('discord.js').GuildEmoji} emoji
	 * @private
	 */
	_createFinalEmojiEmbed(emoji) {
		return new EmbedBuilder()
			.setColor(this.interaction.member?.displayHexColor || '#5865F2')
			.setAuthor({
				name: this.interaction.user.username,
				iconURL: this.interaction.user.displayAvatarURL(),
			})
			.setImage(emoji.imageURL())
			.setTimestamp();
	}
}