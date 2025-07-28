/**
 * fileName       : delete_command
 * author         : Yeong-Huns
 * date           : 25. 7. 27.
 * ===========================================================
 * DATE              AUTHOR             NOTE
 * -----------------------------------------------------------
 * 25. 7. 27.        Yeong-Huns       최초 생성
 */
import dotenv from 'dotenv';
import {REST, Routes} from 'discord.js';

dotenv.config();

const { TOKEN : token , CLIENT_ID : clientId , GUILD_ID : guildId } = process.env;

const rest = new REST({ version: '10' }).setToken(token);

try {
	const commands = await rest.get(Routes.applicationGuildCommands(clientId, guildId));

	if (commands.length === 0) {
		console.log('삭제할 길드용 커맨드가 없습니다.');
		process.exit(0);
	}

	const deletePromises = commands.map(cmd =>
		rest.delete(`${Routes.applicationGuildCommands(clientId, guildId)}/${cmd.id}`)
	);

	await Promise.all(deletePromises);

	console.log(`길드용 커맨드 ${commands.length}개를 삭제했습니다.`);

} catch (error) {
	console.error('길드 커맨드 삭제 중 오류:', error);
	process.exit(1);
}
