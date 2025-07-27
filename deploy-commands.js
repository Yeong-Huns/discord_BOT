/**
 * fileName       : deploy-commands.js
 * author         : Yeong-Huns
 * date           : 25. 7. 22.
 * ===========================================================
 * DATE              AUTHOR             NOTE
 * -----------------------------------------------------------
 * 25. 7. 22.        Yeong-Huns       최초 생성
 */
require('dotenv').config();
const { REST, Routes } = require('discord.js');
const guildId = process.env.GUILD_ID;
const clientId = process.env.CLIENT_ID;
const token = process.env.TOKEN;
const fs = require('fs');
const path = require('path');

const commands = [];
const commandFiles = fs.readdirSync('./slashCommand').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./slashCommand/${file}`);
	commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
	try {
		console.log('길드 슬래시 커맨드 등록 시작...');
		await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: commands },
		);
		console.log('길드 슬래시 커맨드 등록 완료!');

		console.log('글로벌 슬래시 커맨드 등록 시작...');
		const globalResult = await rest.put(
			Routes.applicationCommands(clientId),
			{ body: commands },
		);
		console.log(`글로벌 슬래시 커맨드 등록 완료: ${globalResult.length}개 등록`);
	} catch (error) {
		console.error(error);
	}
})();