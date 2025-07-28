/**
 * fileName       : userSchema
 * author         : Yeong-Huns
 * date           : 25. 7. 26.
 * ===========================================================
 * DATE              AUTHOR             NOTE
 * -----------------------------------------------------------
 * 25. 7. 26.        Yeong-Huns       최초 생성
 */
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
	userId: String,
	serverId: String,
	account: { type: Number, default: 0 },
	lastDeposit: Date,
}, { optimisticConcurrency: true });

export const User = mongoose.model('User', userSchema);