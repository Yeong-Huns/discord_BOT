/**
 * fileName       : cleaner
 * author         : Yeong-Huns
 * date           : 2024-10-07
 * ===========================================================
 * DATE              AUTHOR             NOTE
 * -----------------------------------------------------------
 * 2024-10-07        Yeong-Huns       최초 생성
 */

/**
 * 메세지 삭제
 * @param {Object} message 메시지 객체
 */
export async function cleanMessages(message) {
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
}