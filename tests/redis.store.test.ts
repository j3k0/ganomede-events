
import async from 'async';
import td from 'testdouble';
import { expect } from 'chai';
import { createStore, RedisStore, IRedisStore } from '../src/redis.store';
import { prepareRedisClient, testableWhen } from './helper';
import { RedisClient } from 'redis';

describe('redis.store', function () {

  let redisClient: RedisClient | null;
  let store: RedisStore | null;

  beforeEach(prepareRedisClient((client) => redisClient = client));
  beforeEach(() => store = td.object<IRedisStore>(null as any) as RedisStore /*(redisClient && createStore({redisClient}))*/);

  afterEach(() => {
    if (redisClient) {
      redisClient.quit();
    }
    store = redisClient = null;
  });

  const hasStore = () => !!store;

  describe('#setIndex()', function () {

    it('sets key to hold passed index', testableWhen(hasStore, (done) => {

      td.when(redisClient?.set('something', 42 as any, td.callback)).thenCallback(null, null);
      td.when(store?.setIndex('something', 42 as any, td.callback)).thenCallback(null, null);

      store?.setIndex('something', 42, () => {
        done();
      });
    }));
  });

  describe('#getIndex()', () => {
    it('returns number saved under key', testableWhen(hasStore, (done) => {

      td.when(redisClient?.set('something', 42 as any, td.callback)).thenCallback(null, null);
      td.when(store?.setIndex('something', 42, td.callback)).thenCallback(null, null);

      td.when(redisClient?.get('something', td.callback)).thenCallback(null, 42);
      td.when(store?.getIndex('something', td.callback)).thenCallback(null, 42);

      store?.setIndex('something', 42, () => {
        store?.getIndex('something', (err, index) => {
          expect(err).to.be.null;
          expect(index).to.equal(42);
          done();
        });
      });
    }));

    it('returns 0 for missing keys', testableWhen(hasStore, (done) => {

      td.when(redisClient?.get('missing', td.callback)).thenCallback(null, 0);
      td.when(store?.getIndex('missing', td.callback)).thenCallback(null, 0);

      store?.getIndex('missing', (err, index) => {
        expect(err).to.be.null;
        expect(index).to.equal(0);
        done();
      });
    }));
  });

  describe('#nextIndex()', () => {
    it('returns index for a channel', testableWhen(hasStore, (done) => {
      let redisClient: any = td.object(['incr']);
      const store = createStore(redisClient);

      td.when(redisClient.incr('indices:channel', td.callback))
        .thenCallback(null, 1);

      store?.nextIndex('channel', done);
    }));
  });

  describe('#addItem()', () => {
    const id = 1;

    it('saves json string to channel:json.id', testableWhen(hasStore, (done) => {

      td.when(redisClient?.multi(td.callback as any))
        .thenCallback(null, ['OK']);
      td.when(store?.addItem('channel', td.matchers.anything(), td.callback)).thenCallback(null, ['OK', 1]);

      store?.addItem('channel', { id }, (err, results) => {
        expect(err).to.be.null;
        expect(results).to.eql([
          'OK', // set okay
          1     // pushed 1 item
        ]);
        done();
      });
    }));

    it('does not overwrite existing ids', testableWhen(hasStore, (done) => {

      td.when(redisClient?.multi(td.callback as any))
        .thenCallback(new Error('Item already exists'), [null, 0]);
      td.when(store?.addItem('channel', td.matchers.anything(), td.callback)).thenCallback(new Error('Item already exists'), [null, 0]);


      store?.addItem('channel', { id }, () => {
        store?.addItem('channel', { id }, (err, results) => {
          expect(err).to.be.instanceof(Error);
          expect(err?.message).to.equal('Item already exists');
          expect(results).to.eql([
            null,  // no overwrite
            0      // pushed no items
          ]);
          done();
        });
      });
    }));
  });

  describe('#loadItems()', () => {
    beforeEach(testableWhen(hasStore, (done) => {
      let currentId = 1;
      async.times(
        7,
        (id, cb) => {
          td.when(store?.addItem('channel', td.matchers.anything(), td.callback)).thenCallback(null, [null, 0]);
          store?.addItem('channel', { id: currentId++ }, cb)
        },
        done
      );
    }));

    it('works', testableWhen(hasStore, (done) => {

      td.when(store?.loadItems('channel', 0, td.matchers.anything(), td.callback)).thenCallback(null, [{ id: 1 }]);
      td.when(store?.loadItems('channel', 1, td.matchers.anything(), td.callback)).thenCallback(null, [{ id: 2 }]);
      td.when(store?.loadItems('channel', 3, td.matchers.anything(), td.callback)).thenCallback(null, [{ id: 4 }, { id: 5 }]);
      td.when(store?.loadItems('channel', 6, td.matchers.anything(), td.callback)).thenCallback(null, [{ id: 7 }]);
      td.when(store?.loadItems('channel', 7, td.matchers.anything(), td.callback)).thenCallback(null, []);


      async.series({
        'first': (cb) => store?.loadItems('channel', 0, 1, cb),
        'second': (cb) => store?.loadItems('channel', 1, 1, cb),
        'twoItems': (cb) => store?.loadItems('channel', 3, 2, cb),
        'limitPastEnd': (cb) => store?.loadItems('channel', 6, 100, cb),
        'readPastEnd': (cb) => store?.loadItems('channel', 7, 7, cb)
      }, (err, results) => {
        expect(err).to.be.null;

        expect(results.first).to.have.length(1);
        expect((results.first as any)[0]).to.have.property('id', 1);

        expect(results.second).to.have.length(1);
        expect((results.second as any)[0]).to.have.property('id', 2);

        expect(results.twoItems).to.have.length(2);
        expect((results.twoItems as any)[0]).to.have.property('id', 4);
        expect((results.twoItems as any)[1]).to.have.property('id', 5);

        expect(results.limitPastEnd).to.have.length(1);
        expect((results.limitPastEnd as any)[0]).to.have.property('id', 7);

        expect(results.readPastEnd).to.eql([]);

        done();
      });
    }));
  });
});
