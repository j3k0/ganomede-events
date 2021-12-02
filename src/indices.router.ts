
import { requireSecret } from './middlewares';
import { Server } from 'restify';
import { RedisClient } from 'redis';
import { createGetMiddleware, createPostMiddleware } from './indices.middleware';
import { createStore as createEventsStore, EventsStore } from './events.store';
import { createStore as createRedisStore, RedisStore } from './redis.store';
import { PubSub } from './redis.pubsub';
import { Poll } from './poll';
import { IndexerStorage } from './indexer/indexerSorage';
import { IndexerStreamProcessor } from './indexer/IndexerStreamProcessor';
import { config } from '../config';

export const indicesRouter = (prefix: string, server: Server, redisClient: RedisClient, store?: EventsStore): void => {

  const itemsStore: RedisStore = createRedisStore(redisClient);
  if (!store)
    store = createEventsStore(itemsStore);

  const redisPubClient: RedisClient = redisClient.duplicate();
  const redisSubClient: RedisClient = redisClient.duplicate();
  const pubsub: PubSub = new PubSub(
    redisPubClient, redisSubClient
  );
  const poll = new Poll({ pubsub });
  const indexerStorage: IndexerStorage = new IndexerStorage(redisClient);
  const indexerProcessor: IndexerStreamProcessor = new IndexerStreamProcessor(poll, store, indexerStorage);

  const getIndexData = createGetMiddleware(store, indexerStorage, indexerProcessor);
  const postIndexData = createPostMiddleware(indexerStorage);

  server.post(`${prefix}/indices`, requireSecret, postIndexData);
  server.get(`${prefix}/indices/:indexId/:indexValue`, requireSecret, getIndexData);
};
