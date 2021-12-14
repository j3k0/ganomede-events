
import async from 'async';
import { addOne } from './utils';
import { RedisClient } from 'redis';

// Constants
const INDICES = 'indices';
const KEYS = 'keys';

const key = (group: string, tag: string) => `${group}:${tag}`;


export interface IRedisStore {
  getIndex(key: string, callback: (e: Error | null, res?: number) => void): void;
  setIndex(key: string, idx: number, callback: (e: Error | null, res?: any) => void): void;
  nextIndex(channel: string, callback: () => void): void;
  addItem(channel: string, json: any, callback: (e: Error | null, res?: any) => void): void;
  loadItems(channel: string, start: number, limit: number, callback: (e: Error | null | undefined, res?: any) => void): void;
}

export class RedisStore implements IRedisStore {
  redis: RedisClient;
  constructor(redisClient: RedisClient) {
    this.redis = redisClient;
  }

  getIndex(key: string, callback: (e: Error | null, res?: number) => void): void {
    this.redis.get(key, (err, int) => {
      return err
        ? callback(err)
        : callback(null, int ? parseInt(int, 10) : 0);
    });
  }

  setIndex(key: string, idx: number | undefined, callback: (e: Error | null, res?: any) => void): void {
    this.redis.set(key, String(idx), (err) => callback(err));
  }

  nextIndex(channel: string, callback: (e: Error | null, index?: number) => void): void {
    this.redis.incr(`${INDICES}:${channel}`, callback);
  }

  addItem(channel: string, json: any, callback: (e: Error | null, res?: any) => void): void {
    const hashKey = key(channel, json.id);
    const sortKey = key(channel, KEYS);

    this.redis.multi()
      .set(hashKey, JSON.stringify(json), 'NX')
      .zadd(sortKey, 'NX', json.id, hashKey)
      .exec((err, results) => {
        if (err)
          return callback(err);

        if (results[0] === null)
          return callback(new Error('Item already exists'), results);

        callback(null, results);
      });
  }

  private _loadItems(callback: (e: Error | null | undefined, res?: any) => void, retrieveKeys: (cb: any) => any): void {
    const pullAllItems = (keys: string[], callback: (e: Error | null, results: string[]) => void) => {
      return keys.length > 0
        ? this.redis.mget(keys, callback)
        : callback(null, []);
    };


    async.waterfall([
      retrieveKeys,
      pullAllItems
    ], (err, items: any) => {
      try {
        items = items.map(JSON.parse);
      } catch (e) {
        // we ignore the error here, to bypass lint mepty-block-statement
      }
      callback(err, items);
    });
  }

  getItemsByIds(channel: string, ids: string[], callback: (e?: Error | null, results?: any) => void) {
    const retrieveKeys = (cb: (e: Error | null | undefined, res?: any | null) => void) => {
      const eventKeys = ids.map((id) => { return key(channel, id); });
      cb(null, eventKeys);
    };

    this._loadItems(callback, retrieveKeys);
  }

  loadItems(channel: string, start: number | undefined, limit: number, callback: (e: Error | null | undefined, res?: any) => void): void {
    const retrieveKeys = (callback: (e: Error | null | undefined, res?: any) => void) => {
      this.redis.zrangebyscore(key(channel, KEYS),
        addOne(start), '+inf', 'LIMIT', 0, limit, callback);
    }

    this._loadItems(callback, retrieveKeys);
  }

  loadLatestEvents(channel: string, limit: number, callback: (e: Error | null | undefined, res?: any) => void) {
    const retrieveKeys = (callback: (e: Error | null | undefined, res?: any) => void) =>
      this.redis.zrange(key(channel, KEYS), -limit, -1, callback);

    this._loadItems(callback, retrieveKeys);
  }
}

export const createStore = (redisClient: RedisClient) => new RedisStore(redisClient);
