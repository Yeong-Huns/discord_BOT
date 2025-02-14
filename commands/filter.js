/**
 * fileName       : filter.js
 * author         : Yeong-Huns
 * date           : 2024-10-07
 * ===========================================================
 * DATE              AUTHOR             NOTE
 * -----------------------------------------------------------
 * 2024-10-07        Yeong-Huns       최초 생성
 */



/**
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

module.exports = {
	limitRepeatingCharacters,
	filterEmojis,
	filterUrls
}