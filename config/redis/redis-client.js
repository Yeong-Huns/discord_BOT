/**
 * fileName       : redisClient
 * author         : Yeong-Huns
 * date           : 25. 7. 26.
 * ===========================================================
 * DATE              AUTHOR             NOTE
 * -----------------------------------------------------------
 * 25. 7. 26.        Yeong-Huns       최초 생성
 */
import dotenv from 'dotenv';
import {createClient} from "redis";
dotenv.config();

const { REDIS_USERNAME, REDIS_PASSWORD, REDIS_HOST, REDIS_PORT } = process.env

export const redis = createClient({
	username: REDIS_USERNAME,
	password: REDIS_PASSWORD,
	socket: {
		host: REDIS_HOST,
		port: Number(REDIS_PORT),
	}
});

export async function connectRedis() {
	if (!redis.isOpen) {
		await redis.connect();
	}
}

export const getCachedValue = async (key) => await redis.get(key);

export const setCachedValue = async (key, value, ttl = null) => {
	if(ttl){
		await redis.set(key, value, { EX: ttl});
	} else {
		await redis.set(key, value);
	}
}