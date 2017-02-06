( () => {

'use strict'

const async = require('async')
const utils = require('./utils')


// Constants
const ndxsTag = 'indices'
const keysTag = 'keys'

const invalidClient = 'invalid client'


const _getKey = (grp, tag) => {
  return String(grp) + ':' + String(tag)
}

const _validClient = (client) => {
  return typeof client === 'object' && client !== null
}

const _nextIndex = (client, group, tag, callback) => {
  let key = _getKey(group, tag)
  let cb = utils.messageCallback.bind(null, callback)
  _validClient(client) || cb(invalidClient)
  _validClient(client) &&
    client.incr(key, cb)
}

const _noTransform = (item) => {
  return item
}

const _indexResponse = (item, ndx) => {
  return ndx
}

const _pushItem = (client, item, grp, transform, response, ndx, callback) => {
  // callback here will come from async.waterfall of addItem
  let xform = utils.defaultIfNotFunction(transform, _noTransform)
  let itm = xform(Object.assign({}, item), ndx)
  let hashkey = _getKey(grp, ndx)
  let sortkey = _getKey(grp, keysTag)
  let resp = utils.defaultIfNotFunction(response, _indexResponse)
  let cb = utils.customCallback.bind(null, callback, resp(itm, ndx))
  _validClient(client) || cb(invalidClient)
  _validClient(client) &&
    client.multi()
      .hmset(hashkey, itm)
      .zadd(sortkey, ndx, hashkey)
      .exec(cb)
}

/*
 * transform - function that transforms the item to be added prior to pushing to database.
 *     This is used in case the item needs the index provided.
 * response - function that generates the response message.
 *     This has access to the index and the item's contents.
 */
const addItem = (client, item, group, transform, response, callback) => {
  async.waterfall([
    _nextIndex.bind(null, client, group, ndxsTag),
    _pushItem.bind(null, client, item, group, transform, response),
  ], callback)
}

const _getStartRange = (start) => {
  return start !== undefined ? utils.zeroIfNaN(start) + 1 : 1
}

const _keyRange = (client, grp, start, callback) => {
  // callback here will come from async.waterfall of getItems
  let key = _getKey(grp, keysTag)
  let strt = _getStartRange(start)
  let cb = utils.messageCallback.bind(null, callback)
  _validClient(client) || cb(invalidClient)
  _validClient(client) &&
    client.zrangebyscore(key, strt, '+inf', cb)
}

const _pullEachItem = (client, key, callback) => {
  // callback here will come from async.map of _pullItems
  let cb = utils.messageCallback.bind(null, callback)
  _validClient(client) || cb(invalidClient)
  _validClient(client) &&
    client.hgetall(key, cb)
}

const _pullItems = (client, keys, callback) => {
  // callback here will come from async.waterfall of getItems
  let cb = utils.messageCallback.bind(null, callback)
  async.map(keys,
    _pullEachItem.bind(null, client), cb)
}

const _noFormat = (item) => {
  return item
}

const _formatEachItem = (format, item, callback) => {
  // callback here will come from async.map of _formatItems
  let cb = utils.messageCallback.bind(null, callback)
  let fmt = utils.defaultIfNotFunction(format, _noFormat)
  cb(null, fmt(item))
}

const _formatItems = (fmt, items, callback) => {
  // callback here will come from async.waterfall of getItems
  let cb = utils.messageCallback.bind(null, callback)
  async.map(items,
    _formatEachItem.bind(null, fmt), cb)  
}

/*
 * format - function that formats each item prior to providing it to callback.
 *     This has access to the item's contents.
 */
const getItems = (client, group, start, format, callback) => {
  async.waterfall([
    _keyRange.bind(null, client, group, start),
    _pullItems.bind(null, client),
    _formatItems.bind(null, format),
  ], callback)
}

module.exports = {
  invalidClient,
  addItem,
  getItems,
}

})()
