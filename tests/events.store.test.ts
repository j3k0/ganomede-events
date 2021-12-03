
import { createStore } from '../src/events.store';
import { IRedisStore, RedisStore } from '../src/redis.store';
import { expect } from 'chai';
import td from 'testdouble';

describe('events.store', () => {
  describe('#addEvent()', () => {
    const now = Date.now();
    let actualEvent: any;

    before((done) => {
      const itemsStore = td.object<IRedisStore>();// (['nextIndex', 'addItem']);
      const subject = createStore(itemsStore as RedisStore);
      const expectedHeader = td.matchers.contains({
        id: 5,
        timestamp: now
      });

      td.replace(Date, 'now', () => now);

      td.when(itemsStore.nextIndex('channel', td.callback))
        .thenCallback(null, 5);

      td.when(itemsStore.addItem('channel', expectedHeader, td.callback))
        .thenCallback(null, null);

      subject.addEvent('channel', { from: 'me', type: 'kind', data: {} }, (err, event) => {
        expect(err).to.be.null;
        actualEvent = event;
        done();
      });
    });

    it('returns object', () => {
      expect(actualEvent).to.be.ok;
      expect(actualEvent).to.be.instanceof(Object);
    });

    it('fills in event ID based on store channel index', () => {
      expect(actualEvent.id).to.equal(5);
    });

    it('fills in event timestamp', () => {
      expect(actualEvent.timestamp).to.equal(now);
    });
  });

  describe('#loadEvents()', () => {
    it('updates last fetched index and loads items in case after is explicit', (done) => {
      const itemsStore = td.object<IRedisStore>();// td.object(['setIndex', 'loadItems']);
      const subject = createStore(itemsStore as RedisStore);

      td.when(itemsStore.loadItems('channel', 5, 100, td.callback))
        .thenCallback(null, [1, 2, 3]);

      subject.loadEvents('channel', { clientId: 'client', after: 5, limit: 100, afterExplicitlySet: true }, (err, events) => {
        expect(err).to.be.null;
        expect(events).to.eql([1, 2, 3]);
        td.verify(itemsStore.setIndex('last-fetched:client:channel', 5, td.matchers.isA(Function)));
        done();
      });
    });

    it('asks itemsStore for missing `after` with `clientId`', (done) => {
      const itemsStore = td.object<IRedisStore>();// td.object(['getIndex', 'loadItems']);
      const subject = createStore(itemsStore as RedisStore);

      td.when(itemsStore.getIndex('last-fetched:client:channel', td.callback))
        .thenCallback(null, 5);

      td.when(itemsStore.loadItems('channel', 5, 99, td.callback))
        .thenCallback(null, [1, 2, 3]);

      subject.loadEvents('channel', { clientId: 'client', limit: 99, after: 0 }, (err, events) => {
        expect(err).to.be.null;
        expect(events).to.eql([1, 2, 3]);
        done();
      });
    });
  });
});
