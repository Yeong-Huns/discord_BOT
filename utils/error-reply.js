/**
 * fileName       : error-reply
 * author         : Yeong-Huns
 * date           : 25. 7. 29.
 * ===========================================================
 * DATE              AUTHOR             NOTE
 * -----------------------------------------------------------
 * 25. 7. 29.        Yeong-Huns       최초 생성
 */

export const errorReply = async (interaction, error , message) => {
	console.error(`${message} 명령어 처리 중 오류 발생:`, error);
	await interaction.reply({
		content: `오류가 발생하여 ${message} 명령어를 실행할 수 없습니다. 잠시 후 다시 시도해 주세요.`,
		ephemeral: true
	});
}