/**
 * fileName       : userSchema
 * author         : Yeong-Huns
 * date           : 25. 7. 26.
 * ===========================================================
 * DATE              AUTHOR             NOTE
 * -----------------------------------------------------------
 * 25. 7. 26.        Yeong-Huns       최초 생성
 */
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
	userId: String,
	serverId: String,
	account: { type: Number, default: 0 },
	lastDeposit: Date,
});

const User = mongoose.model('User', userSchema);

module.exports = { userSchema, User};