
import { requireSecret } from './middlewares';
import { createStore as createEventsStore, EventsStore } from './events.store';
import { createStore as createRedisStore, RedisStore } from './redis.store';
import { Server } from 'restify';
import { RedisClient } from 'redis';
import { createMiddleware as createMiddlewareLatest } from './latest.middleware.get';

export const latest = (prefix: string, server: Server, redisClient: RedisClient): void => {


  const itemsStore: RedisStore = createRedisStore(redisClient);
  const store: EventsStore = createEventsStore(itemsStore);

  const getLatest = createMiddlewareLatest(store);

  server.get('/latest', requireSecret, getLatest);
  server.get(`${prefix}/latest`, requireSecret, getLatest);
};