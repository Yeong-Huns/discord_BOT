/**
 * fileName       : mongo-client
 * author         : Yeong-Huns
 * date           : 25. 7. 28.
 * ===========================================================
 * DATE              AUTHOR             NOTE
 * -----------------------------------------------------------
 * 25. 7. 28.        Yeong-Huns       최초 생성
 */
import mongoose from "mongoose";
const { MONGO_URI } = process.env

export async function connectMongo() {
	mongoose.set('strictQuery', true);
	await mongoose.connect(process.env.MONGO_URI)
}