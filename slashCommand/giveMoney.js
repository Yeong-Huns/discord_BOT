/**
 * fileName       : giveMoney
 * author         : Yeong-Huns
 * date           : 25. 7. 26.
 * ===========================================================
 * DATE              AUTHOR             NOTE
 * -----------------------------------------------------------
 * 25. 7. 26.        Yeong-Huns       최초 생성
 */
import dotenv from 'dotenv';
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { User } from '../schema/user.schema.js';
import convertDate from "../utils/convertDate.js";
import { saveCommandLog } from "../utils/logging.js";

dotenv.config();

/* Command */
const slashCommand =
	new SlashCommandBuilder()
		.setName('돈줘')
		.setDescription('게임을 하기 위한 돈을 받습니다.')

/* Service */
const execute = async (interaction) => {
	const userId = interaction.user.id;
	const serverId = interaction.guildId;
	const now = new Date();

	let user = await User.findOne({userId, serverId});

	if (!user) {
		user = new User({
			userId,
			serverId,
			account: 0,
			lastDeposit: null,
		});
	}

	if (user.lastDeposit) {
		const lastDate = new Date(user.lastDeposit);
		const isSameDay = convertDate(now) === convertDate(lastDate);
		if (isSameDay) {
			const embed = new EmbedBuilder()
				.setDescription("**🚨 이미 오늘 돈을 받으셨습니다**")
				.setColor(0xe74c3c)
				.setFooter({
					text: '돈줘',
					iconURL: interaction.user.displayAvatarURL({dynamic: true})
				})
			await interaction.reply({embeds: [embed]});
			return;
		}
	}

	user.account += 10000;
	user.lastDeposit = now;

	try {
		await user.save();
	} catch (error) {
		if (error.name === 'VersionError') {
			const embed = new EmbedBuilder()
				.setTitle('버전키 충돌')
				.setDescription("**🚨 너무 빠르게 시도하고 있습니다**")
				.setColor(0xe74c3c)
				.setFooter({
					text: '문제가 발생한 커맨드 : `/돈줘`',
					iconURL: interaction.user.displayAvatarURL({dynamic: true})
				})
			await interaction.reply({embeds: [embed]});
			return;
		}
	}

	const embed = new EmbedBuilder()
		.setTitle('돈 지급 (하루에 한번 가능)')
		.setDescription(`**10,000₩을 드렸어요\n\n잔액 : ${user.account.toLocaleString('ko-KR', {style: 'currency', currency: 'KRW'})}**`)
		.setColor(0x27ae60)
		.setFooter({
			text: interaction.user.username,
			iconURL: interaction.user.displayAvatarURL({dynamic: true})
		})

	await interaction.reply({embeds: [embed]});
	await saveCommandLog(interaction, {
		optionAmount: Number(10000),
		userBalance: user.account
	});
}

export default {
	data: slashCommand,
	execute,
}