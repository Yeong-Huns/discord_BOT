/**
 * fileName       : index
 * author         : Yeong-Huns
 * date           : 2024-09-26
 * ===========================================================
 * DATE              AUTHOR             NOTE
 * -----------------------------------------------------------
 * 2024-09-26        Yeong-Huns       최초 생성
 */
require('dotenv').config();
const {Client, GatewayIntentBits, Partials, EmbedBuilder, Events, Collection } = require('discord.js');
const {limitRepeatingCharacters, filterEmojis, filterUrls} = require('./commands/filter');
const {connectToVoiceChannel, processQueue, disconnectFromVoiceChannel, voiceConnections} = require('./commands/ttsHandler')
const {cleanMessages} = require('./commands/cleaner');
const selectGifCommand = require('./commands/selectgif');
const selectEmojisCommand = require('./commands/selectEmoji')
const {detectEmojis} = require('./commands/autoEmoji');
const fs = require('fs');
const path = require('path');
const {connectRedis} = require("./config/redis/redisClient");

connectRedis();

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent
	],
	partials: [Partials.Channel]
});

const TOKEN = process.env.TOKEN;

client.commands = new Collection();

// 커맨드 폴더에서 모든 명령어 파일을 읽어서 등록
const commandsPath = path.join(__dirname, 'slashCommand');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	client.commands.set(command.data.name, command);
}

client.once('ready', () => {
	console.log(`${client.user.tag} 봇 준비 완료!`);
});

client.on('messageCreate', async (message) => {
	if (message.author.bot) return;
	if (!message.content || message.attachments.size > 0) return; // 이미지, 파일 무시
	await detectEmojis(message);
	if (message.content === '-만든놈') message.channel.send('김영훈');
	if (message.content === '-핑') message.channel.send('퐁!');
	if (message.content === '-인사') message.channel.send('안녕하세요! 헤실봇 인사 테스트입니다!');
	if (message.content === '-도움') {
		const embed = new EmbedBuilder()
			.setColor(0x0099FF) // 임베드 색상 지정
			.setTitle('명령어 안내')
			.setDescription(' ')
			.addFields(
				{name: '`-핑`', value: '서버가 살아있는지 테스트합니다.'},
				{name: '`-도움`', value: '명령어를 출력합니다.'},
				{name: '`-음성`', value: '음성채널에서 TTS를 지원합니다.'},
				{name: '`-나가`', value: '음성채널에서 나갑니다.'},
				{name: '`-청소` __*1~100 사이 숫자*__', value: '1~100개 사이의 메세지를 삭제합니다.'},
				{name: '`-gif`', value: '서버에 등록된 gif 이모지를 출력합니다.'},
				{name: '`-콘`', value: '서버에 등록된 정적 이모지를 출력합니다.'}
			);

		message.channel.send({embeds: [embed]});
	} else if (message.content.startsWith('-청소')) {
		await cleanMessages(message);
		return;
	} else if (message.content === '-gif') {
		await selectGifCommand.execute(message);
		return;
	} else if (message.content === '-콘') {
		await selectEmojisCommand.execute(message);
		return;
	}

	const commands = ['-음성', '-TTS', '-기계성대'];
	if (commands.includes(message.content)) {
		const voiceChannel = message.member.voice.channel;
		if (!voiceChannel) {
			return message.reply('음성 채널에 입장 후 명령어를 입력해주세요.');
		}

		if (!voiceConnections[voiceChannel.id]) {
			connectToVoiceChannel(voiceChannel, message);
		}
		return;
	}

	const voiceChannel = message.member.voice.channel;
	if (voiceChannel && voiceConnections[voiceChannel.id] && !message.author.bot) {
		if (message.channel.id === voiceConnections[voiceChannel.id].textChannelId) {
			let text = limitRepeatingCharacters(message.content);
			text = filterEmojis(text);
			text = filterUrls(text);
			voiceConnections[voiceChannel.id].messageQueue.push({message, text});
			if (!voiceConnections[voiceChannel.id].isPlaying) processQueue(voiceChannel.id, client);
		}
	}

	if (message.content === '-종료' || message.content === '-나가' || message.content === '-그만') {
		const voiceChannel = message.member.voice.channel;
		if (voiceChannel && voiceConnections[voiceChannel.id]) {
			disconnectFromVoiceChannel(voiceChannel.id);
			message.reply('음성 지원을 종료하고, 채널을 떠납니다.');
		} else {
			message.reply('해당 봇은 음성 채널에 연결된 상태가 아닙니다.');
		}
	}
});

/* 슬래시 커맨드 실행 이벤트 리스너 */
client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: '명령어 실행 중 오류가 발생했습니다.', ephemeral: true });
	}
});

client.on('interactionCreate', async (interaction) => {
	if (!interaction.isButton()) return;

	if (interaction.customId.startsWith('send_gif_')) {
		await selectGifCommand.handleButtonInteraction(interaction);
	}

	if (
		interaction.customId.startsWith('send_emoji_') ||
		interaction.customId === 'emoji_prev_page' ||
		interaction.customId === 'emoji_next_page' ||
		interaction.customId === 'emoji_page_indicator'
	) {
		await selectEmojisCommand.handleButtonInteraction(interaction);
	}
});

client.on('voiceStateUpdate', (oldState, newState) => {
	const voiceChannelId = oldState.channelId || newState.channelId;
	if (voiceConnections[voiceChannelId]) {
		const channel = client.channels.cache.get(voiceChannelId);

		if (channel && channel.members.size === 1) { // 봇만 남아있으면 나가기
			disconnectFromVoiceChannel(voiceChannelId);
			console.log('음성 채널에 아무도 없어서 봇이 나갔습니다.');
		}
	}
});


client.on('guildMemberAdd', (member) => {
	const channel = member.guild.channels.cache.find(channel => channel.name === '환영-인사와-규칙' || channel.name === 'test');
	if (!channel) return;
	channel.send(`${member} 님이 방금 서버에 합류하셨어요!`);
});

client.login(TOKEN);

client.on('error', (error) => {
	console.error('Discord Client에서 오류 발생:', error);
});

client.on('shardError', (error, shardId) => {
	console.error(`Shard ${shardId}에서 오류 발생:`, error);
});

client.on('warn', (info) => {
	console.warn('Warning:', info);
});