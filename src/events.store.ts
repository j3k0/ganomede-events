
import { AsyncResultCallback, waterfall } from 'async';
import { logger } from './logger';
import { RedisStore } from './redis.store';

const lastFetchedKey = (clientId: string, channel: string) => `last-fetched:${clientId}:${channel}`;

export type EventDefinition = {
  type: string;
  from: string;
  data?: any;
}

export type Event = {
  id: number;
  timestamp: number;
  type: string;
  from: string;
  data?: any;
}

export type LoadEventsParam = {
  clientId: string,
  after: number,
  limit?: number,
  afterExplicitlySet?: any
};

export class EventsStore {
  items: RedisStore;

  constructor(itemsStore: RedisStore) {
    this.items = itemsStore;
  }

  addEvent(channel: string, eventArg: EventDefinition, callback: AsyncResultCallback<any, Error>) {
    waterfall([
      (cb: (e: Error | null, index?: number) => void) => this.items.nextIndex(channel, cb),
      (id: number, cb: (e: Error | null, event?: Event) => void) => {
        const event:Event = Object.assign({
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

  getEventsByIds(channel: string, eventIds: string[], callback: (e?: Error | null, results?: Event[] | null) => void) {
    this.items.getItemsByIds(channel, eventIds, callback);
  }

  _load(channel: string, after: number | undefined, limit: number | undefined, callback: (e: Error | null | undefined, res?: Event[]) => void) {
    // Try updating last fetched index.
    // Start loading stuff.
    this.items.loadItems(channel, after, limit!, callback);
  }

  _loadWithLastFetched(clientId: string, channel: string, limit: number | undefined, callback: (e: Error | null | undefined, res?: Event[]) => void) {
    waterfall([
      (cb: (e: Error | null, event?: any) => void) => this.items.getIndex(lastFetchedKey(clientId, channel), cb),
      (after: number, cb: (e: Error | null | undefined, res?: any) => void) => this._load(channel, after, limit, cb)
    ], callback);
  }

  loadLatestItems(channel: string, limit: number, callback: (e: Error | null | undefined, res?: any) => void) {
    this.items.loadLatestEvents(channel, limit, callback);
  }

  loadEvents(channel: string, { clientId, after, limit, afterExplicitlySet }: LoadEventsParam, callback: (e: Error | null | undefined, res?: Event[]) => void) {
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

export const createStore = (itemsStore: RedisStore) => new EventsStore(itemsStore);
