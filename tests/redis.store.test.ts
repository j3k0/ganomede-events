'use strict';

import async from 'async';
const td = require('testdouble');
const {expect} = require('chai');
const {createStore} = require('../src/redis.store');
const {prepareRedisClient, testableWhen} = require('./helper');

describe('redis.store', function () {

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

  describe('#setIndex()', function () {
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
      async.series({
        'first': (cb) => store.loadItems('channel', 0, 1, cb),
        'second': (cb) => store.loadItems('channel', 1, 1, cb),
        'twoItems': (cb) => store.loadItems('channel', 3, 2, cb),
        'limitPastEnd': (cb) => store.loadItems('channel', 6, 100, cb),
        'readPastEnd': (cb) => store.loadItems('channel', 7, 7, cb)
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
