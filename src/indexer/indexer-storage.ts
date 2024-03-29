/**
 * Indexer Storage class: used to store the indexes created based on channel, and field
 * ex: { "id": "blocked-users-by-username", "channel": "users/v1/blocked-users", "field": "data.username"}
 * in redis we will store 2 things:
 * - "indices:id-of-the-index-definition" like "indices:blocked-users-by-username"
 *    => this one will contains the index definition as json string
 * - "index:id-of-the-index-definition:value-Of-field" like "index:blocked-users-by-username:user1"
 *    => this one will contains the event-ids for all the events that having for example "data.username"=user1
 * That's why later, we can retreive the events for a specific index like group-by feature.
 */
import { RedisClient } from "redis";
import { Event } from "../events.store";
import { IndexDefinition } from "../models/index-definition";

const INDICES_KEYS = 'indices';

export class IndexerStorage {

  indexPrefix = 'index';
  redis: RedisClient;
  constructor(redisClient: RedisClient) {
    this.redis = redisClient;
  }

  private indexName(prefix: string, id: string, val?: string) {
    return `${prefix}:${id}` + (val ? `:${val}` : '');
  }

  // create index in redis
  createIndex(item: IndexDefinition, callback: (e: Error | null, res?: string) => void) {
    this.redis.set(this.indexName(INDICES_KEYS, item.id), JSON.stringify(item), 'NX', (err, results) => {
      if (err)
        return callback(err);

      // If the index already exists, it's not an error... The endpoint allows this.
      // if (results[0] === null)
      //   return callback(new Error('Key already exists'), results);

      callback(null, results);
    });
  }

  //we need to get the definition of the index stored by its id.
  getIndexDefinition(id: string, callback: (err: Error | null, result: IndexDefinition | null) => void) {
    this.redis.get(this.indexName(INDICES_KEYS, id), (err: Error | null, result: string | null) => {
      if (err)
        return callback(err, null);

      if (result === null)
        return callback(err, null);

      callback(null, JSON.parse(result));
    });
  }

  // Add the event to the index.
  addToIndex(item: IndexDefinition, event: Event, value: string, callback: (e: Error | null, res?: number) => void) {
    const indexName = this.indexName(this.indexPrefix, item.id, value);
    // To make sure the element isn't already in the index, we do some cleanup before inserting.
    // A better implementation could use `lpos` to look for the element before inserting, but this requires Redis 6.
    // (At the moment, we still use Redis 4 in production).
    this.redis.multi()
      .lrem(indexName, 0, String(event.id))
      .lpush(indexName, String(event.id))
      .exec((err, resultsArray) => {
        if (err) {
          return callback(err);
        }
        callback(null, resultsArray[1]);
      });
  }

  // Return the list of event ids
  getEventIds(indexId: string, value: string, callback: (e: Error | null, res?: string[] | null) => void) {
    this.redis.lrange(this.indexName(this.indexPrefix, indexId, value), 0, -1, (err: Error | null, results: string[]) => {
      if (err)
        return callback(err);

      callback(err, results);
    });
  }

}
