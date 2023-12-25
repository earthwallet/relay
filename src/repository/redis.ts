import { Redis } from 'ioredis';
import { RateLimiterRedis } from 'rate-limiter-flexible';

const redisAuth = process.env.REDIS_AUTH === 'true';

const client = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  ...(redisAuth && { username: process.env.REDIS_USERNAME }),
  ...(redisAuth && { password: process.env.REDIS_PASSWORD })
});

// TODO
client.on('error', (err) => {
  console.log(err);
});

export const ping = async (prom_redis_health: any) => {
  try {
    await client.ping();
    prom_redis_health.set(1);
  } catch (error) {
    console.log(error);
    prom_redis_health.set(0);
  }
};

export const limit = (prom_redis_ratelimited_clients: any, key: string, callback: any) => {
  const rateLimiter = new RateLimiterRedis({
    storeClient: client,
    points: parseInt(process.env.RATELIMIT_POINTS),
    duration: parseInt(process.env.RATELIMIT_DURATION_SECONDS)
  });

  rateLimiter.consume(key, 1).then(callback).catch((e) => {
    console.log(e);
    if (e instanceof Error) {
      console.log(e);
    } else {
      prom_redis_ratelimited_clients.inc();
    }
  });
};
