'use strict';

const async = require('async');
const lodash = require('lodash');
const utils = require('./utils');

// Constants
const clientLabel = 'Redis client';
const eventLabel = 'Event';
const paramsLabel = 'Parameters';
const channelLabel = 'Channel';
const afterLabel = 'After ID';

const idProp = 'id';
const chProp = 'channel';
const timeProp = 'timestamp';
const dataProp = 'data';
const afterProp = 'after';

const idsTag = 'ids';
const keysTag = 'keys';

const _messageCallback = (err, msg, cb) => {
  err &&
    utils.logError(err, cb) ||
  (cb && cb(null, msg));
};

const _customCallback = (err, msg, custom, cb) => {
  err &&
    utils.logError(err, cb) ||
  (cb && cb(null, custom));
};

const _getKey = (ch, tag) => {
  return ch + ':' + String(tag);
};

const _nextIdFromRedis = (client, ch, cb) => {
  let key = _getKey(ch, idsTag);
  client
    .incr(key, cb);
};

const _nextIdWaterfall = (client, ch, cb) => {
  _nextIdFromRedis(client, ch,
    lodash.partialRight(_messageCallback, cb)
  );
};

const _insertIdTime = (res, id, time) => {
  res[idProp]   = id;
  res[timeProp] = time;
  return res;
};

const _formatEventDataForStore = (event) => {
  (dataProp in event) &&
    (event[dataProp] = utils.objectToString(event[dataProp]));
  return event;
};

const _pushEventToRedis = (client, id, event, cb) => {
  let time = new Date().getTime();
  let id_time = _insertIdTime({}, id, time);
  event = _insertIdTime(event, id, time);
  event = _formatEventDataForStore(event);
  let ch = event[chProp];
  let hashkey = _getKey(ch, id);
  let sortkey = _getKey(ch, keysTag);
  client
    .multi()
    .hmset(hashkey, event)
    .zadd(sortkey, id, hashkey)
    .exec(lodash.partialRight(cb, id_time));
};

const _pushEventWaterfall = (client, event, id, cb) => {
  _pushEventToRedis(client, id, event,
    lodash.partialRight(_customCallback, cb)
  );
};

const addEvent = (client, event, callback) => {
  utils.objectCheck(client, clientLabel);
  utils.objectCheck(event, eventLabel);
  utils.propertyCheck(event, chProp, eventLabel);
  utils.stringCheck(event[chProp], channelLabel);
  async.waterfall([
    _nextIdWaterfall.bind(null, client, event[chProp]),
    _pushEventWaterfall.bind(null, client, event)
  ], callback);
};

const _getStartRange = (after) => {
  return (
    (typeof after === 'undefined') &&
      1 ||
    after + 1
  );
};

const _keyRangeFromRedis = (client, ch, after, cb) => {
  let key = _getKey(ch, keysTag);
  let start = _getStartRange(after);
  client
    .zrangebyscore(key, start, '+inf', cb);
};

const _keyRangeWaterfall = (client, ch, after, cb) => {
  _keyRangeFromRedis(client, ch, after,
    lodash.partialRight(_messageCallback, cb)
  );
};

const _pullEventFromRedis = (client, key, cb) => {
  client
    .hgetall(key, cb);
};

const _pullEventsWaterfall = (client, keys, cb) => {
  async.map(
    keys,
    _pullEventFromRedis.bind(null, client),
    lodash.partialRight(_messageCallback, cb)
  );
};

const _formatEventNumbers = (event) => {
  event[idProp] = parseInt(event[idProp]);
  event[timeProp] = parseInt(event[timeProp]);
  return event;
};

const _formatEventDataForUse = (event) => {
  (dataProp in event) &&
    (event[dataProp] = utils.stringToObject(event[dataProp]));
  return event;
};

const _formatEvent = (event, cb) => {
  event = _formatEventNumbers(event);
  event = _formatEventDataForUse(event);
  cb(null, event);
};

const _formatEventsWaterfall = (events, cb) => {
  async.map(
    events,
    _formatEvent,
    lodash.partialRight(_messageCallback, cb)
  );  
};

const getEvents = (client, params, callback) => {
  utils.objectCheck(client, clientLabel);
  utils.objectCheck(params, paramsLabel);
  utils.propertyCheck(params, chProp, paramsLabel);
  utils.stringCheck(params[chProp], channelLabel);
  utils.numberCheckIfExists(params, afterProp, afterLabel);
  async.waterfall([
    _keyRangeWaterfall.bind(null, client, params[chProp], params[afterProp]),
    _pullEventsWaterfall.bind(null, client),
    _formatEventsWaterfall
  ], callback);
};

module.exports = {
  addEvent:   addEvent,
  getEvents:  getEvents,
};
