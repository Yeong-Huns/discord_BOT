/**
 * fileName       : convertDate
 * author         : Yeong-Huns
 * date           : 25. 7. 27.
 * ===========================================================
 * DATE              AUTHOR             NOTE
 * -----------------------------------------------------------
 * 25. 7. 27.        Yeong-Huns       최초 생성
 */

const convertDate = (date) => {
	const utc = date.getTime();
	const kstDate = new Date(utc + 9 * 60 * 60 * 1000);
	return kstDate.toISOString().slice(0, 10);
}

export default convertDate;