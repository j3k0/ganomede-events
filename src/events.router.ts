
import { RedisClient } from 'redis';
import async from 'async';
import { requireSecret } from './middlewares';
import { createStore as createEventsStore, EventsStore } from './events.store';
import { createStore as createRedisStore } from './redis.store';
import { Poll } from './poll';
import { Server } from 'restify';
import { PubSub } from './redis.pubsub';
import { createMiddleware as createMiddlewareGet } from './events.middleware.get';
import { createMiddleware as createMiddlewarePost } from './events.middleware.post';

export const createEventsRouter = (prefix: string, server: Server, redisClient: RedisClient) => {

  const itemsStore = createRedisStore(redisClient);
  const store: EventsStore = createEventsStore(itemsStore);
  const redisPubClient: RedisClient = redisClient.duplicate();
  const redisSubClient: RedisClient = redisClient.duplicate();
  const pubsub: PubSub = new PubSub(
    redisPubClient, redisSubClient
  );
  const poll = new Poll(pubsub);

  const getEvents = createMiddlewareGet(poll, store);
  const postEvent = createMiddlewarePost(poll, store);

  server.post(`${prefix}/events`,
    requireSecret, postEvent);
  server.get(`${prefix}/events`,
    requireSecret, getEvents);

  return {
    close: (cb: () => void) => {
      async.parallel([
        (cb) => redisPubClient.quit(cb),
        (cb) => redisSubClient.quit(cb)
      ], cb);
    }
  };
};
