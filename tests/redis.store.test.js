'use strict';

const async = require('async');
const {createStore} = require('../src/redis.store');
const {prepareRedisClient} = require('./helper');

describe('redis.store', function() {

  let redisClient;
  let store;

  beforeEach(prepareRedisClient((client) => redisClient = client));
  beforeEach(() => store = (redisClient && createStore({redisClient})));

  afterEach(() => {
    if (redisClient) {
      redisClient.quit();
    }
    store = redisClient = null;
  });

  const hasStore = () => !!store;

  describe('#setIndex()', function() {
    it('sets key to hold passed index', testableWhen(hasStore, (done) => {
      store.setIndex('something', 42, done);
    }));
  });

  describe('#getIndex()', () => {
    it('returns number saved under key', testableWhen(hasStore, (done) => {
      store.setIndex('something', 42, () => {
        store.getIndex('something', (err, index) => {
          expect(err).to.be.null;
          expect(index).to.equal(42);
          done();
        });
      });
    }));

    it('returns 0 for missing keys', testableWhen(hasStore, (done) => {
      store.getIndex('missing', (err, index) => {
        expect(err).to.be.null;
        expect(index).to.equal(0);
        done();
      });
    }));
  });

  describe('#nextIndex()', () => {
    it('returns index for a channel', testableWhen(hasStore, (done) => {
      const redisClient = td.object(['incr']);
      const store = createStore({redisClient});

      td.when(redisClient.incr('indices:channel', td.callback))
        .thenCallback(null, 1);

      store.nextIndex('channel', done);
    }));
  });

  describe('#addItem()', () => {
    const id = 1;

    it('saves json string to channel:json.id', testableWhen(hasStore, (done) => {
      store.addItem('channel', {id}, (err, results) => {
        expect(err).to.be.null;
        expect(results).to.eql([
          'OK', // set okay
          1     // pushed 1 item
        ]);
        done();
      });
    }));

    it('does not overwrite existing ids', testableWhen(hasStore, (done) => {
      store.addItem('channel', {id}, () => {
        store.addItem('channel', {id}, (err, results) => {
          expect(err).to.be.instanceof(Error);
          expect(err.message).to.equal('Item already exists');
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
        (id, cb) => store.addItem('channel', {id: currentId++}, cb),
        done
      );
    }));

    it('works', testableWhen(hasStore, (done) => {
      async.series([
        (cb) => store.loadItems('channel', 0, 1, cb),
        (cb) => store.loadItems('channel', 1, 1, cb),
        (cb) => store.loadItems('channel', 3, 2, cb),
        (cb) => store.loadItems('channel', 6, 100, cb),
        (cb) => store.loadItems('channel', 7, 7, cb)
      ], (err, [first, second, twoItems, limitPastEnd, readPastEnd]) => {
        expect(err).to.be.null;

        expect(first).to.have.length(1);
        expect(first[0]).to.have.property('id', 1);

        expect(second).to.have.length(1);
        expect(second[0]).to.have.property('id', 2);

        expect(twoItems).to.have.length(2);
        expect(twoItems[0]).to.have.property('id', 4);
        expect(twoItems[1]).to.have.property('id', 5);

        expect(limitPastEnd).to.have.length(1);
        expect(limitPastEnd[0]).to.have.property('id', 7);

        expect(readPastEnd).to.eql([]);

        done();
      });
    }));
  });
});
