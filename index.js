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
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const gTTS = require('gtts');
const fs = require('fs');
const path = require('path');

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

let currentConnection = null;
let messageQueue = [];
let isPlaying = false;

function limitRepeatingCharacters(text, maxRepeats = 5) {
	return text.replace(/(.)\1{4,}/g, (match, char) => char.repeat(maxRepeats));
}

async function processQueue() {
	if (isPlaying || messageQueue.length === 0) return;

	const { message, text } = messageQueue.shift();
	isPlaying = true;

	const tts = new gTTS(text, 'ko');
	const filePath = path.join(__dirname, 'tts_output.mp3');

	tts.save(filePath, async (err) => {
		if (err) {
			console.error('TTS 파일 생성 중 오류가 발생했습니다:', err);
			isPlaying = false;
			await processQueue();
			return;
		}

		if (currentConnection) {
			const player = createAudioPlayer();
			const resource = createAudioResource(filePath);

			player.play(resource);
			currentConnection.subscribe(player);

			player.on(AudioPlayerStatus.Idle, () => {
				if (fs.existsSync(filePath)) {
					fs.unlinkSync(filePath);
				}

				isPlaying = false;
				processQueue();
			});
		} else {
			message.reply('음성 채널에 연결되어 있지 않습니다.');
			isPlaying = false;
			await processQueue();
		}
	});
}

client.once('ready', () => {
	console.log(`${client.user.tag} 봇 준비 완료!`);
});

client.on('messageCreate', async (message) => {
	if (message.author.bot) return;


	if(message.content === '-만든놈') message.channel.send('김영훈');
	if (message.content === '-핑') message.channel.send('퐁!');
	if (message.content === '-인사') message.channel.send('안녕하세요! 헤실봇 인사 테스트입니다!');
	if (message.content === '-도움') message.channel.send(`제가 인식하는 명령어는 다음과 같습니다:
	-핑: 서버가 살아있는지 테스트합니다.
	-도움: 명령어를 출력합니다.
	-음성: 음성채널에서 TTS를 지원합니다. 
	-나가: 음성채널에서 나갑니다.
	-청소 [1~200] 1~200개 사이의 메세지를 삭제합니다.`);
//'제가 인식하는 명령어는 다음과 같습니다: -핑, -인사, -도움, -음성, -나가, -청소'
	if (message.content.startsWith('-청소')) {
		const args = message.content.split(' ');
		const deleteCount = parseInt(args[1], 10);

		// 유효한 숫자가 입력되었는지 확인
		if (!deleteCount || deleteCount < 1 || deleteCount > 200) {
			return message.reply('1에서 200 사이의 숫자를 입력해주세요.');
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


	const commands = ['-음성', '-TTS' , '-기계성대'];
	if (commands.includes(message.content)) {
		const voiceChannel = message.member.voice.channel;
		if (!voiceChannel) {
			return message.reply('음성 채널에 입장 후 명령어를 입력해주세요.');
		}

		try {
			currentConnection = joinVoiceChannel({
				channelId: voiceChannel.id,
				guildId: voiceChannel.guild.id,
				adapterCreator: voiceChannel.guild.voiceAdapterCreator,
			});
			message.reply('채널 참가 완료, 이제부터 TTS 기능을 지원합니다.');
		} catch (err) {
			console.error(err);
			return message.reply('채널에 합류하는 데 실패하였습니다...');
		}
		return;
	}

	if (currentConnection && !message.author.bot) {
		const text = limitRepeatingCharacters(message.content);
		messageQueue.push({message, text});
		await processQueue();
	}

	if (message.content === '-종료' || message.content === '-나가' || message.content === '-그만') {
		if (currentConnection) {
			currentConnection.destroy();
			currentConnection = null;
			message.reply('음성 지원을 종료하고, 채널을 떠납니다.');
		} else {
			message.reply('해당 봇은 음성 채널에 연결된 상태가 아닙니다.');
		}
	}
});

client.on('voiceStateUpdate', (oldState, newState) => {
	if (currentConnection) {
		const voiceChannel = currentConnection.joinConfig.channelId;
		const channel = client.channels.cache.get(voiceChannel);

		if (channel && channel.members.size === 1) {  // 봇만 남아있으면 나가기
			currentConnection.destroy();
			currentConnection = null;
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
