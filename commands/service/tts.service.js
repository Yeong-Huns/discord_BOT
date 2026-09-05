/**
 * fileName       : tts.service
 * author         : Yeong-Huns
 * date           : 26. 8. 22.
 * ===========================================================
 * DATE              AUTHOR             NOTE
 * -----------------------------------------------------------
 * 26. 8. 22.        Yeong-Huns       legacy/ttsHandler.js 슬래시 커맨드 전환에 따른 이전
 */
import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } from '@discordjs/voice';
import { EmbedBuilder, MessageFlags } from 'discord.js';
import gTTS from 'gtts';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import path from 'path'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


export const voiceConnections = {};

/**
 * 음성 채널에 관련된 mp3 파일 삭제
 * @param {String} voiceChannelId 음성 채널 ID
 */
export function deleteChannelMessage(voiceChannelId) {
	fs.readdir(__dirname, (err, files) => {
		if (err) {
			console.error('파일 목록을 읽는 중 오류가 발생했습니다:', err);
			return;
		}

		files.forEach(file => {
			if (file.endsWith('.mp3') && file.startsWith(voiceChannelId)) {
				const filePath = path.join(__dirname, file);
				fs.unlink(filePath, (err) => {
					if (err) {
						console.error(`${filePath} 파일 삭제 중 오류가 발생했습니다:`, err);
					} else {
						console.log(`${filePath} 파일이 삭제되었습니다.`);
					}
				});
			}
		});
	});
}

/**
 * TTS 처리 후 큐에서 다음 메시지를 재생하도록 하는 함수
 * @param {String} voiceChannelId 음성 채널 ID
 * @param {Object} client 디스코드 클라이언트 객체
 */
export function processQueue(voiceChannelId, client) {
	if (!voiceConnections[voiceChannelId] || voiceConnections[voiceChannelId].isPlaying || voiceConnections[voiceChannelId].messageQueue.length === 0) return;

	const { messageQueue, connection } = voiceConnections[voiceChannelId];
	const { message, text } = messageQueue.shift();
	voiceConnections[voiceChannelId].isPlaying = true;

	const tts = new gTTS(text, 'ko');
	const filePath = path.join(__dirname, `${voiceChannelId}_${uuidv4()}.mp3`);

	tts.save(filePath, (err) => {
		if (err) {
			console.error('TTS 파일 생성 중 오류가 발생했습니다:', err);
			voiceConnections[voiceChannelId].isPlaying = false;
			processQueue(voiceChannelId, client);
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
				handlePlayerIdle(voiceChannelId, client);
			});
		} else {
			voiceConnections[voiceChannelId].isPlaying = false;
			processQueue(voiceChannelId, client);
		}
	});
}

/**
 * 플레이어가 재생을 마쳤을 때 처리
 * @param {String} voiceChannelId 음성 채널 ID
 * @param {Object} client 디스코드 클라이언트 객체
 */
export function handlePlayerIdle(voiceChannelId, client) {
	const channel = client.channels.cache.get(voiceChannelId);

	if (channel && voiceConnections[voiceChannelId]) {
		if (channel.members.size === 1) {
			disconnectFromVoiceChannel(voiceChannelId);
		} else {
			voiceConnections[voiceChannelId].isPlaying = false;
			processQueue(voiceChannelId, client);
		}
	}
}

/**
 * 봇이 음성 채널에서 나가기
 * @param {String} voiceChannelId 음성 채널 ID
 */
export function disconnectFromVoiceChannel(voiceChannelId) {
	if (voiceConnections[voiceChannelId]) {
		// 메시지 큐와 재생 상태 초기화
		voiceConnections[voiceChannelId].messageQueue = [];
		voiceConnections[voiceChannelId].isPlaying = false;
		const connection = voiceConnections[voiceChannelId].connection;
		// 채널 관련 TTS 파일 삭제
		deleteChannelMessage(voiceChannelId);

		// 음성 채널 연결 종료
		if (connection.state.status !== 'destroyed')voiceConnections[voiceChannelId].connection.destroy();
		delete voiceConnections[voiceChannelId];

	}
}

export class TtsService {
	/**
	 * @param {import('discord.js').CommandInteraction} interaction
	 */
	constructor(interaction) {
		this.interaction = interaction;
		this.voiceChannel = interaction.member?.voice?.channel;
	}

	/**
	 * @desc 음성 채널 참가 및 TTS 지원 시작
	 */
	async join() {
		if (!this.voiceChannel) {
			return { content: '음성 채널에 입장 후 명령어를 입력해주세요.', flags: MessageFlags.Ephemeral };
		}

		if (voiceConnections[this.voiceChannel.id]) {
			return { content: '이미 해당 음성 채널에서 TTS 기능을 지원하고 있습니다.', flags: MessageFlags.Ephemeral };
		}

		try {
			const connection = joinVoiceChannel({
				channelId: this.voiceChannel.id,
				guildId: this.voiceChannel.guild.id,
				adapterCreator: this.voiceChannel.guild.voiceAdapterCreator,
			});

			voiceConnections[this.voiceChannel.id] = {
				connection,
				textChannelId: this.interaction.channelId,
				messageQueue: [],
				isPlaying: false,
			};
			return { embeds: [this._createEmbed(0x57f287, '✅ 채널 참가 완료, 이제부터 TTS 기능을 지원합니다.')] };
		} catch (err) {
			console.error('음성 채널 연결 실패:', err);
			return { content: '채널에 합류하는 데 실패하였습니다...', flags: MessageFlags.Ephemeral };
		}
	}

	/**
	 * @desc 음성 채널에서 나가기
	 */
	async leave() {
		if (this.voiceChannel && voiceConnections[this.voiceChannel.id]) {
			disconnectFromVoiceChannel(this.voiceChannel.id);
			return { embeds: [this._createEmbed(0x0099FF, '👋 음성 지원을 종료하고, 채널을 떠납니다.')] };
		}
		return { content: '해당 봇은 음성 채널에 연결된 상태가 아닙니다.', flags: MessageFlags.Ephemeral };
	}

	/**
	 * @desc 안내 메세지 생성
	 * @private
	 */
	_createEmbed(color, description) {
		return new EmbedBuilder()
			.setColor(color)
			.setDescription(`**${description}**`);
	}
}
