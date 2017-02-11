'use strict'

const async = require('async')
const utils = require('./utils')
const identity = (x) => x

// Constants
const INDICES = 'indices'
const KEYS = 'keys'

const errors = {
  invalidClient: 'invalid redisClient'
}

const key = (group, tag) => `${group}:${tag}`
const isRedisClient = (redisClient) =>
  typeof redisClient === 'object' && redisClient !== null

const createStore = ({
  redisClient
}) => ({

/*
 * - itemFactory: Function(data, index)
 *    Function that initializes the data to be added to database.
 *    It is provided with the data itself and index of the item.
 */
addItem: (group, data, itemFactory, callback) => {

  if (!isRedisClient(redisClient))
    return callback(new Error(errors.invalidClient))

  const incrIndex = (callback) =>
    redisClient.incr(key(group, INDICES), callback)

  const pushItem = (index, callback) => {
    const hashKey = key(group, index)
    const sortKey = key(group, KEYS)
    const item = itemFactory(data, index)
    const done = (err) => callback(err, item)

    redisClient.multi()
      .set(hashKey, JSON.stringify(item))
      .zadd(sortKey, index, hashKey)
      .exec(done)
  }

  async.waterfall([ incrIndex, pushItem ], callback)
},

loadItems: (group, start, callback) => {

  if (!isRedisClient(redisClient))
    return callback(new Error(errors.invalidClient))

  const retrieveKeys = (callback) =>
    redisClient.zrangebyscore(key(group, KEYS),
      utils.addOne(start), '+inf', callback)

  const pullAllItems = (keys, callback) =>
    keys.length > 0
      ? redisClient.mget(keys, callback)
      : callback(null, []);

  async.waterfall([
    retrieveKeys,
    pullAllItems
  ], (err, items) => {
    try {
      items = items.map(JSON.parse);
    } catch (e) {}
    callback(err, items);
  })
}
})

module.exports = {
  errors,
  createStore
}
