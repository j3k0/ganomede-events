'use strict'

const async = require('async')
const utils = require('./utils')
const identity = (x) => x

// Constants
const INDICES = 'indices'
const KEYS = 'keys'

const invalidClient = 'invalid redisClient'

const key = (group, tag) => `${group}:${tag}`

const isRedisClient = (redisClient) =>
  typeof redisClient === 'object' && redisClient !== null

/*
 * - serializer
 *    Function that transforms the item to be added prior to pushing to database.
 *    This is used in case the item needs the index provided.
 */
const addItem = (redisClient, data, group, itemFactory, callback) => {

  itemFactory = itemFactory || identity

  if (!isRedisClient(redisClient))
    return callback(new Error(invalidClient))

  const incrIndex = (callback) =>
    redisClient.incr(key(group, INDICES), callback)

  const pushItem = (index, callback) => {
    const hashKey = key(group, index)
    const sortKey = key(group, KEYS)
    const item = itemFactory(data, index)
    const done = (err) => callback(err, item)

    redisClient.multi()
      .hmset(hashKey, item)
      .zadd(sortKey, index, hashKey)
      .exec(done)
  }

  async.waterfall([ incrIndex, pushItem ], callback)
}

const getItems = (redisClient, group, start, callback) => {

  if (!isRedisClient(redisClient))
    return callback(new Error(invalidClient))

  const retrieveKeys = (callback) =>
    redisClient.zrangebyscore(key(group, KEYS),
      utils.addOne(start), '+inf', callback)

  const pullEachItem = (key, callback) =>
    redisClient.hgetall(key, callback)

  const pullAllItems = (keys, callback) =>
    async.map(keys, pullEachItem, callback)

  async.waterfall([
    retrieveKeys,
    pullAllItems
  ], callback)
}

module.exports = {
  invalidClient,
  addItem,
  getItems,
}
