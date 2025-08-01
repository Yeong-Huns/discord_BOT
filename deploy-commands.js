/**
 * fileName       : deploy-legacy.js
 * author         : Yeong-Huns
 * date           : 25. 7. 22.
 * ===========================================================
 * DATE              AUTHOR             NOTE
 * -----------------------------------------------------------
 * 25. 7. 22.        Yeong-Huns       최초 생성
 */
import dotenv from 'dotenv';
import {REST, Routes} from 'discord.js';
import fs from 'fs';
import path from "path";
import {fileURLToPath} from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const { TOKEN : token , CLIENT_ID : clientId , GUILD_ID : guildId } = process.env;

const commands = [];
const commandsPath = path.join(__dirname, 'commands', 'interface');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));


for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = await import(`file://${filePath}`);
	if (command.default.data) {
		commands.push(command.default.data.toJSON());
	}
}

const rest = new REST({ version: '10' }).setToken(token);

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
