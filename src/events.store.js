const async = require('async');
const utils = require('./utils');
const identity = (x) => x;

// Error codes
const errors = {
  invalidEvent: 'invalid event',
  invalidChannel: 'invalid channel',
  invalidAfterId: 'invalid after ID'
};

const isValidEvent = (event) =>
  typeof event === 'object' && event !== null;

const isValidChannel = (channel) =>
  typeof channel === 'string';

const isValidAfterId = (after) => {
  return after === undefined ||
    typeof after === 'number' ||
    typeof after === 'string' && !isNaN(parseInt(after));
};

// Initializes an events store.
//
// depends upon an `itemsStore`,  an object with the following methods:
//
//    - loadItems(channel, id, callback)
//    - addItem(channel, event, itemFactory, callback)
//
// (see redis.store.js for a redis implementation of an item store)
//
const createStore = ({
  itemsStore
}) => {

  return {

  // Store a new event in a channel
    addEvent: (channel, event, callback) => {

      if (!isValidEvent(event))
        return callback(new Error(errors.invalidEvent));

      if (!isValidChannel(channel))
        return callback(new Error(errors.invalidChannel));

      const itemFactory = (data, index) => ({
        id: index,
        timestamp: new Date().getTime(),
        from: data.from,
        type: data.type,
        data: data.data
      });

      itemsStore.addItem(channel, event, itemFactory, callback);
    },

  // Retrieve all events from a channel, with ids bigger than the given one
    loadEvents: (channel, id, callback) => {

      callback = callback || identity;

      if (!isValidChannel(channel))
        return callback(new Error(errors.invalidChannel));

      if (!isValidAfterId(id))
        return callback(new Error(errors.invalidAfterId));

      const formatEvent = (event) => ({
        id: parseInt(event.id),
        timestamp: parseInt(event.timestamp),
        type: event.type,
        from: event.from,
        data: event.data
      });

      const done = (err, items) => err
      ? callback(err)
      : callback(null, items.map(formatEvent));

      itemsStore.loadItems(channel, id, done);
    }
  };};

module.exports = {
  createStore,
  errors
};
