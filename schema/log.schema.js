/**
 * fileName       : log.Schema
 * author         : Yeong-Huns
 * date           : 25. 7. 27.
 * ===========================================================
 * DATE              AUTHOR             NOTE
 * -----------------------------------------------------------
 * 25. 7. 27.        Yeong-Huns       최초 생성
 */
const mongoose = require('mongoose');

const commandLogSchema = new mongoose.Schema({
	userId: { type: String, required: true },
	username: { type: String, required: true },
	serverId: { type: String, required: true },
	servername: { type: String, required: true },
	commandName: { type: String, required: true },
	date: { type: String, required: true },
	optionAmount: { type: Number, default: null }, // 선택적
	userBalance: { type: Number, default: null },

	createdAt: { type: Date, default: Date.now, index: { expires: '7d' } }
});

const CommandLog = mongoose.model('CommandLog', commandLogSchema);

module.exports = { CommandLog } ;