/**
 * fileName       : index
 * author         : Yeong-Huns
 * date           : 2024-09-26
 * ===========================================================
 * DATE              AUTHOR             NOTE
 * -----------------------------------------------------------
 * 2024-09-26        Yeong-Huns       최초 생성
 */
import dotenv from "dotenv";
dotenv.config();

import {Client, Collection, EmbedBuilder, Events, GatewayIntentBits, Partials} from "discord.js";
import {filterEmojis, filterUrls, limitRepeatingCharacters} from "./legacy/filter.js";
import {connectToVoiceChannel, disconnectFromVoiceChannel, processQueue, voiceConnections} from "./legacy/ttsHandler.js"
import selectGifCommand from "./legacy/selectgif.js";
import {detectEmojis} from "./legacy/autoEmoji.js";
import fs from "fs";
import path from "path";
import {connectRedis} from "./config/redis/redis-client.js";
import {connectMongo} from "./config/mongo/mongo-client.js";

await Promise.all([
	connectMongo(),
	connectRedis()
]);

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent
	],
	partials: [Partials.Channel]
});

const {TOKEN} = process.env;

client.commands = new Collection();

/* 커맨드 폴더에서 모든 명령어 파일을 읽어서 등록 */
const commandsPath = path.join(process.cwd(), 'commands', 'interface');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = `./${path.relative(process.cwd(), path.join(commandsPath, file))}`;
	const command = await import(filePath);
	client.commands.set(command.default.data.name, command.default);
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
	else if (message.content === '-gif') {
		await selectGifCommand.execute(message);
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
		await interaction.reply({content: '명령어 실행 중 오류가 발생했습니다.', ephemeral: true});
		return;
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

await client.login(TOKEN);

client.on('error', (error) => {
	console.error('Discord Client에서 오류 발생:', error);
});

client.on('shardError', (error, shardId) => {
	console.error(`Shard ${shardId}에서 오류 발생:`, error);
});

client.on('warn', (info) => {
	console.warn('Warning:', info);
});