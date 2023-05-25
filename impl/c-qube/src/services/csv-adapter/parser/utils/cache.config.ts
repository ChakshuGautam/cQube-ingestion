/* eslint-disable prettier/prettier */
import * as redisStore from 'cache-manager-redis-store';

export const cacheConfig = {
  ttl: 3600, // Cache TTL in seconds (1 hour)
  store: redisStore,
  host: 'localhost', // Redis server host
  port: 6379, // Redis server port
};
