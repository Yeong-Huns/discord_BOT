/**
 * fileName       : convertDate
 * author         : Yeong-Huns
 * date           : 25. 7. 27.
 * ===========================================================
 * DATE              AUTHOR             NOTE
 * -----------------------------------------------------------
 * 25. 7. 27.        Yeong-Huns       최초 생성
 */

const convertDate = (date) => date.toISOString().slice(0, 10);

module.exports = convertDate;