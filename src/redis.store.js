'use strict';

const async = require('async');
const utils = require('./utils');

// Constants
const INDICES = 'indices';
const KEYS = 'keys';

const key = (group, tag) => `${group}:${tag}`;

class RedisStore {
  constructor (redisClient) {
    this.redis = redisClient;
  }

  getIndex (key, callback) {
    this.redis.get(key, (err, int) => {
      return err
        ? callback(err)
        : callback(null, int ? parseInt(int, 10) : 0);
    });
  }

  setIndex (key, idx, callback) {
    this.redis.set(key, String(idx), (err) => callback(err));
  }

  nextIndex (channel, callback) {
    this.redis.incr(`${INDICES}:${channel}`, callback);
  }

  addItem (channel, json, callback) {
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

  loadItems (channel, start, limit, callback) {
    const retrieveKeys = (callback) =>
    this.redis.zrangebyscore(key(channel, KEYS),
      utils.addOne(start), '+inf', 'LIMIT', 0, limit, callback);

    const pullAllItems = (keys, callback) => {
      return keys.length > 0
        ? this.redis.mget(keys, callback)
        : callback(null, []);
    };

    async.waterfall([
      retrieveKeys,
      pullAllItems
    ], (err, items) => {
      try {
        items = items.map(JSON.parse);
      } catch (e) {}
      callback(err, items);
    });
  }

  loadLatestEvents (channel, limit, callback) {
    // this.redis.zrange(key(channel, KEYS), -limit, -1, (err, results) => {
    //   callback(err, results);
    // });

    const retrieveKeys = (callback) =>
    this.redis.zrange(key(channel, KEYS), -limit, -1, callback);

    const pullAllItems = (keys, callback) => {
      return keys.length > 0
        ? this.redis.mget(keys, callback)
        : callback(null, []);
    };

    async.waterfall([
      retrieveKeys,
      pullAllItems
    ], (err, items) => {
      try {
        items = items.map(JSON.parse);
      } catch (e) {}
      callback(err, items);
    });
  }
}

const createStore = ({redisClient}) => new RedisStore(redisClient);
module.exports = {createStore};
