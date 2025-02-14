/**
 * fileName       : selectEmoji
 * author         : Yeong-Huns
 * date           : 2025-02-15
 * ===========================================================
 * DATE              AUTHOR             NOTE
 * -----------------------------------------------------------
 * 2025-02-15        Yeong-Huns       최초 생성
 */
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Collection } = require('discord.js');

const buttonAuthorCache = new Collection();
const paginationCache = new Collection(); // 메시지별 페이징 상태 저장

// 한 페이지에 최대 20개의 이모지, 각 행당 최대 5개의 버튼 (총 4행 + 네비게이션 1행 = 5행)
const PAGE_SIZE = 20;
const BUTTONS_PER_ROW = 5;

function generateEmojiRows(emojis, currentPage, totalPages) {
	const start = (currentPage - 1) * PAGE_SIZE;
	const end = start + PAGE_SIZE;
	const pageEmojis = emojis.slice(start, end);

	const rows = [];
	let currentRow = new ActionRowBuilder();

	pageEmojis.forEach((emoji, index) => {
		// 매 행에 최대 BUTTONS_PER_ROW 개의 버튼을 추가
		if (index % BUTTONS_PER_ROW === 0 && index !== 0) {
			rows.push(currentRow);
			currentRow = new ActionRowBuilder();
		}
		currentRow.addComponents(
			new ButtonBuilder()
				.setCustomId(`send_emoji_${emoji.id}`)
				.setStyle(ButtonStyle.Primary)
				.setEmoji({ id: emoji.id, animated: emoji.animated })
		);
	});

	if (currentRow.components.length > 0) {
		rows.push(currentRow);
	}

	// 네비게이션 버튼 (전체 페이지가 1페이지보다 많을 경우)
	if (totalPages > 1) {
		const navRow = new ActionRowBuilder();
		navRow.addComponents(
			new ButtonBuilder()
				.setCustomId('emoji_prev_page')
				.setLabel('◀ 이전')
				.setStyle(ButtonStyle.Secondary)
				.setDisabled(currentPage === 1),
			new ButtonBuilder()
				.setCustomId('emoji_page_indicator')
				.setLabel(`페이지 ${currentPage}/${totalPages}`)
				.setStyle(ButtonStyle.Secondary)
				.setDisabled(true),
			new ButtonBuilder()
				.setCustomId('emoji_next_page')
				.setLabel('다음 ▶')
				.setStyle(ButtonStyle.Secondary)
				.setDisabled(currentPage === totalPages)
		);
		rows.push(navRow);
	}

	return rows;
}

module.exports = {
	name: 'selectEmoji',
	description: '서버 내의 이모지들을 버튼으로 선택할 수 있는 인터페이스를 제공합니다. (페이징 포함)',
	async execute(message) {
		// 서버의 모든 정적 이모지 목록을 가져옴
		const emojiList = await message.guild.emojis.fetch();
		const emojis = Array.from(emojiList.filter(emoji => !emoji.animated).values());

		if (!emojis.length) {
			message.channel.send('서버에 등록된 이모지가 없습니다.');
			return;
		}

		const totalPages = Math.ceil(emojis.length / PAGE_SIZE);
		const currentPage = 1;

		const rows = generateEmojiRows(emojis, currentPage, totalPages);
		const sentMessage = await message.channel.send({
			content: '원하는 이모지를 선택하세요:',
			components: rows
		});

		// 페이징 상태와 작성자 정보를 캐시에 저장
		paginationCache.set(sentMessage.id, { emojis, currentPage, totalPages });
		buttonAuthorCache.set(sentMessage.id, message.author.id);
	},

	async handleButtonInteraction(interaction) {
		const customId = interaction.customId;
		const messageId = interaction.message.id;
		const authorId = buttonAuthorCache.get(messageId);

		// 작성자 본인만 인터랙션 가능
		if (interaction.user.id !== authorId) {
			const embed = new EmbedBuilder()
				.setColor(interaction.member.displayHexColor)
				.setTitle('다른 사용자가 이용중입니다.')
				.setImage('https://upload3.inven.co.kr/upload/2020/07/22/bbs/i13163888308.jpg?MW=800');
			await interaction.reply({ embeds: [embed], ephemeral: true });
			return;
		}

		// 페이지 네비게이션 버튼 처리
		if (customId === 'emoji_prev_page' || customId === 'emoji_next_page') {
			const paginationData = paginationCache.get(messageId);
			if (!paginationData) {
				await interaction.reply({ content: '페이징 데이터를 찾을 수 없습니다.', ephemeral: true });
				return;
			}
			let { emojis, currentPage, totalPages } = paginationData;
			if (customId === 'emoji_prev_page' && currentPage > 1) {
				currentPage--;
			} else if (customId === 'emoji_next_page' && currentPage < totalPages) {
				currentPage++;
			}
			// 캐시 업데이트 및 메시지 컴포넌트 재생성
			paginationCache.set(messageId, { emojis, currentPage, totalPages });
			const newRows = generateEmojiRows(emojis, currentPage, totalPages);
			await interaction.update({ components: newRows });
			return;
		}

		// 이모지 선택 버튼 처리
		if (customId.startsWith('send_emoji_')) {
			const emojiId = customId.split('_')[2];
			const emoji = interaction.guild.emojis.cache.get(emojiId);

			if (emoji) {
				const avatarUrl = interaction.user.displayAvatarURL();
				const embed = new EmbedBuilder()
					.setColor(interaction.member.displayHexColor)
					.setAuthor({
						name: interaction.user.username,
						iconURL: avatarUrl,
					})
					.setImage(emoji.url)
					.setTimestamp();

				await interaction.reply({ embeds: [embed] });
				try {
					await interaction.message.delete();
				} catch (error) {
					console.error('메시지를 삭제하는 중 오류가 발생했습니다:', error);
				}
			} else {
				await interaction.reply({ content: '해당 이모지를 찾을 수 없습니다.', ephemeral: true });
			}
		}
	},
};