/**
 * fileName       : selectgif
 * author         : Yeong-Huns
 * date           : 2024-10-07
 * ===========================================================
 * DATE              AUTHOR             NOTE
 * -----------------------------------------------------------
 * 2024-10-07        Yeong-Huns       최초 생성
 */
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Collection } = require('discord.js');

const buttonAuthorCache = new Collection();

module.exports = {
	name: 'selectgif',
	description: '서버 내의 GIF 이모지들을 버튼으로 선택할 수 있는 인터페이스를 제공합니다.',
	async execute(message) {
		/* 최신 이모지 내역을 불러옴 */
		const emojis = await message.guild.emojis.fetch();
		const gifEmojis = Array.from(emojis.filter(emoji => emoji.animated).values());

		if (!gifEmojis.length) {
			message.channel.send('서버에 GIF 이모지가 없습니다.');
			return;
		}

		const rows = [];
		let currentRow = new ActionRowBuilder();

		gifEmojis.forEach((emoji, index) => {
			if (index % 4 === 0 && index !== 0) {
				rows.push(currentRow);
				currentRow = new ActionRowBuilder();
			}
			currentRow.addComponents(
				new ButtonBuilder()
					.setCustomId(`send_gif_${emoji.id}`)
					.setStyle(ButtonStyle.Primary)
					.setEmoji({ id: emoji.id, animated: emoji.animated })
			);
		});

		if (currentRow.components.length > 0) {
			rows.push(currentRow);
		}

		const sentMessage = await message.channel.send({
			content: '원하는 GIF 이모지를 선택하세요:',
			components: rows
		});

		buttonAuthorCache.set(sentMessage.id, message.author.id);
	},
	async handleButtonInteraction(interaction) {
		const emojiId = interaction.customId.split('_')[2];
		const messageId = interaction.message.id;
		const authorId = buttonAuthorCache.get(messageId);

		if(interaction.user.id !== authorId){
			const embed = new EmbedBuilder()
				.setColor(interaction.member.displayHexColor)
				.setTitle('다른 사용자가 이용중입니다.')
				.setImage('https://upload3.inven.co.kr/upload/2020/07/22/bbs/i13163888308.jpg?MW=800')
			await interaction.reply({embeds: [embed], ephemeral: true})
			return;
		}

		const emoji = interaction.guild.emojis.cache.get(emojiId);

		if (emoji) {
			const avatarUrl = interaction.user.displayAvatarURL();

			const embed = new EmbedBuilder()
				.setColor(interaction.member.displayHexColor)
				.setAuthor({
					name: interaction.user.username,
					iconURL: avatarUrl,
				})
				.setImage(emoji.url);

			await interaction.reply({ embeds: [embed] });
			try {
				await interaction.message.delete();
			} catch (error) {
				console.error('메시지를 삭제하는 중 오류가 발생했습니다:', error);
			}
		} else {
			await interaction.reply({ content: '해당 이모지를 찾을 수 없습니다.', ephemeral: true });
		}
	},
};