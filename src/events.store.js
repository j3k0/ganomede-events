'use strict';

const async = require('async');

const createStore = ({
  itemsStore
}) => {

  return {

  // Store a new event in a channel
    addEvent: (channel, eventArg, callback) => {
      async.waterfall([
        (cb) => itemsStore.getIndex(channel, cb),
        (id, cb) => {
          const event = Object.assign({
            id,
            timestamp: Date.now(),
          }, eventArg);

          itemsStore.addItem(channel, event, (err) => {
            return err
              ? cb(err)
              : cb(null, event);
          });
        }
      ], callback);
    },

  // Retrieve all events from a channel, with ids bigger than the given one
    loadEvents: (channel, id, limit, callback) => {
      itemsStore.loadItems(channel, id, limit, callback);
    }
  };};

module.exports = {createStore};
