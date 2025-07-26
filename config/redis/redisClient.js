/**
 * fileName       : redisClient
 * author         : Yeong-Huns
 * date           : 25. 7. 26.
 * ===========================================================
 * DATE              AUTHOR             NOTE
 * -----------------------------------------------------------
 * 25. 7. 26.        Yeong-Huns       최초 생성
 */
require('dotenv').config();
const { createClient } = require('redis');

const { REDIS_USERNAME, REDIS_PASSWORD, REDIS_HOST, REDIS_PORT } = process.env

const redis = createClient({
	username: REDIS_USERNAME,
	password: REDIS_PASSWORD,
	socket: {
		host: REDIS_HOST,
		port: Number(REDIS_PORT),
	}
});

async function connectRedis() {
	if (!redis.isOpen) {
		await redis.connect();
	}
}

const getCachedValue = async (key) => await redis.get(key);

const setCachedValue = async (key, value, ttl) => await redis.set(key, value, { EX: ttl});

module.exports = { redis, connectRedis, getCachedValue, setCachedValue };
