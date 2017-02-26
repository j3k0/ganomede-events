'use strict';

const async = require('async');

class EventsStore {
  constructor (itemsStore) {
    this.items = itemsStore;
  }

  addEvent (channel, eventArg, callback) {
    async.waterfall([
      (cb) => this.items.nextIndex(channel, cb),
      (id, cb) => {
        const event = Object.assign({
          id,
          timestamp: Date.now(),
        }, eventArg);

        this.items.addItem(channel, event, (err) => {
          return err
            ? cb(err)
            : cb(null, event);
        });
      }
    ], callback);
  }

  loadEvents (channel, {clientId, after, limit, afterExplicitlySet}, callback) {
    this.items.loadItems(channel, after, limit, callback);
  }
}

const createStore = ({itemsStore}) => new EventsStore(itemsStore);
module.exports = {createStore};
