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
const {Client, GatewayIntentBits, Partials} = require('discord.js');
const {joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus} = require('@discordjs/voice');
const gTTS = require('gtts');
const fs = require('fs');
const path = require('path');
const {v4: uuidv4} = require('uuid');

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

const voiceConnections = {};

/**
 *
 * @param {String} text
 * @param maxRepeats
 * @returns {String}
 * @description 반복되는 문자열 ex) 'ㅋㅋㅋㅋㅋ' 같은 경우 최대 5번만 재생함
 */
function limitRepeatingCharacters(text, maxRepeats = 5) {
	return text.replace(/(.)\1{4,}/g, (match, char) => char.repeat(maxRepeats));
}

/**
 *
 * @param {String} text
 * @returns {String}
 * @description 이모티콘 형식 <:{이름}:{숫자}>에서 {이름}만 남기고 제거
 */
function filterEmojis(text) {
	return text.replace(/<:[a-zA-Z0-9_]+:\d+>/g, (match) => {
		const emojiName = match.split(':')[1];
		return emojiName ? `:${emojiName}:` : match;
	});
}

/**
 *
 * @param {String} text
 * @returns {String}
 * @description URL 패턴을 정규식으로 찾고, "URL 링크"로 대체
 */
function filterUrls(text) {
	return text.replace(/https?:\/\/[^\s]+/g, 'URL 링크');
}

function deleteChannelMessage(voiceChannel){
	fs.readdir(__dirname, (err, files) => {
		if (err) throw err;

		files.forEach(file => {
			if (file.endsWith('.mp3') && file.startsWith(voiceChannel)) {
				fs.unlink(path.join(__dirname, file), (err) => {
					if (err) throw err;
				});
			}
		});
	});
}

async function processQueue(voiceChannelId) {
	if (!voiceConnections[voiceChannelId] || voiceConnections[voiceChannelId].isPlaying || voiceConnections[voiceChannelId].messageQueue.length === 0) return;

	const { messageQueue, connection } = voiceConnections[voiceChannelId];
	const { message, text } = messageQueue.shift();
	voiceConnections[voiceChannelId].isPlaying = true;

	const tts = new gTTS(text, 'ko');
	const filePath = path.join(__dirname, `${voiceChannelId}_${uuidv4()}.mp3`);

	tts.save(filePath, async (err) => {
		if (err) {
			console.error('TTS 파일 생성 중 오류가 발생했습니다:', err);
			voiceConnections[voiceChannelId].isPlaying = false;
			processQueue(voiceChannelId);
			return;
		}

		if (connection) {
			const player = createAudioPlayer();
			const resource = createAudioResource(filePath);

			player.play(resource);
			connection.subscribe(player);

			player.on(AudioPlayerStatus.Idle, () => {
				if (fs.existsSync(filePath)) {
					fs.unlinkSync(filePath);
				}
				const channel = client.channels.cache.get(voiceChannelId);

				if (channel && channel.members.size === 1) {
					console.log('음성 채널에 아무도 없어서 봇이 나갔습니다.');
					connection.destroy();
					delete voiceConnections[voiceChannelId];
				} else {
					voiceConnections[voiceChannelId].isPlaying = false;
					processQueue(voiceChannelId);
				}
			});
		} else {
			message.reply('음성 채널에 연결되어 있지 않습니다.');
			voiceConnections[voiceChannelId].isPlaying = false;
			processQueue(voiceChannelId);
		}
	});
}

client.once('ready', () => {
	console.log(`${client.user.tag} 봇 준비 완료!`);
});

client.on('messageCreate', async (message) => {
	if (message.author.bot) return;
	if (!message.content || message.attachments.size > 0) return; // 이미지, 파일 무시
	if (message.content === '-만든놈') message.channel.send('김영훈');
	if (message.content === '-핑') message.channel.send('퐁!');
	if (message.content === '-인사') message.channel.send('안녕하세요! 헤실봇 인사 테스트입니다!');
	if (message.content === '-도움') message.channel.send(`제가 인식하는 명령어는 다음과 같습니다:
	-핑: 서버가 살아있는지 테스트합니다.
	-도움: 명령어를 출력합니다.
	-음성: 음성채널에서 TTS를 지원합니다. 
	-나가: 음성채널에서 나갑니다.
	-청소 [1~100] 1~100개 사이의 메세지를 삭제합니다.`);

	if (message.content.startsWith('-청소')) {
		const args = message.content.split(' ');
		const deleteCount = parseInt(args[1], 10);

		// 유효한 숫자가 입력되었는지 확인
		if (!deleteCount || deleteCount < 1 || deleteCount > 100) {
			return message.reply('1에서 100 사이의 숫자를 입력해주세요.');
		}

		// 메시지를 삭제
		try {
			await message.channel.bulkDelete(deleteCount, true);
			message.channel.send(`${deleteCount}개의 메시지가 삭제되었습니다.`).then(msg => {
				setTimeout(() => msg.delete(), 3000); // 안내 메시지도 삭제
			});
		} catch (err) {
			console.error(err);
			message.reply('메시지를 삭제하는 중 오류가 발생했습니다.');
		}
		return;
	}


	const commands = ['-음성', '-TTS', '-기계성대'];
	if (commands.includes(message.content)) {
		const voiceChannel = message.member.voice.channel;
		if (!voiceChannel) {
			return message.reply('음성 채널에 입장 후 명령어를 입력해주세요.');
		}

		if (!voiceConnections[voiceChannel.id]) {
			try {
				const connection = joinVoiceChannel({
					channelId: voiceChannel.id,
					guildId: voiceChannel.guild.id,
					adapterCreator: voiceChannel.guild.voiceAdapterCreator,
				});

				voiceConnections[voiceChannel.id] = {
					connection,
					textChannelId: message.channel.id,
					messageQueue: [],
					isPlaying: false
				};
				message.reply('채널 참가 완료, 이제부터 TTS 기능을 지원합니다.');
			} catch (err) {
				console.error(err);
				return message.reply('채널에 합류하는 데 실패하였습니다...');
			}
		}
		return;
	}

	const voiceChannel = message.member.voice.channel;
	if (voiceChannel && voiceConnections[voiceChannel.id] && !message.author.bot) {
		if (message.channel.id === voiceConnections[voiceChannel.id].textChannelId) {
			let text = limitRepeatingCharacters(message.content);
			text = filterEmojis(text);
			text = filterUrls(text);
			voiceConnections[voiceChannel.id].messageQueue.push({ message, text });
			if (!voiceConnections[voiceChannel.id].isPlaying) processQueue(voiceChannel.id);
		}
	}

	if (message.content === '-종료' || message.content === '-나가' || message.content === '-그만') {
		const voiceChannel = message.member.voice.channel;
		if (voiceChannel && voiceConnections[voiceChannel.id]) {
			voiceConnections[voiceChannel.id].messageQueue = [];
			voiceConnections[voiceChannel.id].isPlaying = false;

			deleteChannelMessage(voiceChannel.id);

			voiceConnections[voiceChannel.id].connection.destroy();
			delete voiceConnections[voiceChannel.id];
			message.reply('음성 지원을 종료하고, 채널을 떠납니다.');
		} else {
			message.reply('해당 봇은 음성 채널에 연결된 상태가 아닙니다.');
		}
	}
});

client.on('voiceStateUpdate', (oldState, newState) => {
	const voiceChannelId = oldState.channelId || newState.channelId;
	if (voiceConnections[voiceChannelId]) {
		const channel = client.channels.cache.get(voiceChannelId);

		if (channel && channel.members.size === 1) { // 봇만 남아있으면 나가기
			voiceConnections[voiceChannelId].messageQueue = [];
			voiceConnections[voiceChannelId].isPlaying = false;

			deleteChannelMessage(voiceChannelId);

			voiceConnections[voiceChannelId].connection.destroy();
			delete voiceConnections[voiceChannelId];
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
