'use strict';

import async from 'async';
const logger = require('./logger');

const lastFetchedKey = (clientId, channel) => `last-fetched:${clientId}:${channel}`;

export class EventsStore {
  items: any;

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
    // Try updating last fetched index.


    // Start loading stuff.
    this.items.loadItems(channel, after, limit, callback);
  }

  _loadWithLastFetched (clientId, channel, limit, callback) {
    async.waterfall([
      (cb) => this.items.getIndex(lastFetchedKey(clientId, channel), cb),
      (after, cb) => this._load(channel, after, limit, cb)
    ], callback);
  }

  loadLatestItems (channel, limit, callback) {
    this.items.loadLatestEvents(channel, limit, callback);
  }

  loadEvents (channel, {clientId, after, limit, afterExplicitlySet}: {clientId:string, after?: number, limit?: number, afterExplicitlySet?:any}, callback) {
    if (afterExplicitlySet) {
      // In addition to loading items, treat this request as an ACK
      // that client processed all the messages with id up to `after`
      // and update last-fetched to be that.
      const key = lastFetchedKey(clientId, channel);
      this.items.setIndex(key, after, (err) => {
        if (err)
          logger.error('Failed to update "%s"', key, err);
      });
      return this._load(channel, after, limit, callback);
    }

    this._loadWithLastFetched(clientId, channel, limit, callback);
  }
}

export const createStore = ({itemsStore}) => new EventsStore(itemsStore);
