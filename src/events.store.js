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

  _load (channel, after, limit, callback) {
    this.items.loadItems(channel, after, limit, callback);
  }

  _loadWithLastFetched (clientId, channel, limit, callback) {
    async.waterfall([
      (cb) => this.items.getIndex(`last-fetched:${clientId}:${channel}`, cb),
      (after, cb) => this._load(channel, after, limit, cb)
    ], callback);
  }

  loadEvents (channel, {clientId, after, limit, afterExplicitlySet}, callback) {
    return afterExplicitlySet
      ? this._load(channel, after, limit, callback)
      : this._loadWithLastFetched(clientId, channel, limit, callback);
  }
}

const createStore = ({itemsStore}) => new EventsStore(itemsStore);
module.exports = {createStore};
