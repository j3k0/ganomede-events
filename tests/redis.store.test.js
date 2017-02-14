'use strict';

const {expect} = require('chai');
const async = require('async');
const redis = require('fakeredis');
const redisStore = require('../src/redis.store');

describe('redis.store', () => {

  let redisClient;
  let store;
  const limit = 100;
  const item = {};
  const start = 1;
  const group = 'group';

  beforeEach(done => {
    redisClient = redis.createClient(0, 'localhost');
    store = redisStore.createStore({redisClient});
    redisClient.flushdb(done);
  });

  afterEach(done => {
    redisClient.flushdb(() => {
      redisClient.quit();
      done();
    });
  });

  const itemFactory = (data, index) =>
  Object.assign({}, data, {index});

  const addItem = (callback) =>
  store.addItem(group, item, itemFactory, callback);

  describe('.addItem', () => {

    it('should allow parallel use', (done) => {
      const expects = (err, indices) => {
        expect(err).to.be.null;
        expect(indices[0].index)
        .to.not.equal(indices[1])
        .to.not.equal(indices[2])
        .to.not.equal(indices[3]);
        expect(indices[1].index)
        .to.not.equal(indices[2])
        .to.not.equal(indices[3]);
        expect(indices[2].index)
        .to.not.equal(indices[3]);
        done();
      };
      async.parallel([addItem, addItem, addItem, addItem], expects);
    });

    it('should provide next index', (done) => {
      const expects = (err, indices) => {
        expect(err).to.be.null;
        expect(indices[1].index).to.equal(indices[0].index + 1);
        done();
      };
      async.series([addItem, addItem], expects);
    });

  });

  describe('.loadItems', () => {

    it('should succeed when all parameters are defined', (done) => {
      store.loadItems(group, start, limit, (err, msg) => {
        expect(err).to.be.null;
        done();
      });
    });

  });

  describe('All together now', () => {
    beforeEach((done) => {
      async.times(
        7,
        (id, cb) => store.addItem('channel', {}, itemFactory, cb),
        done
      );
    });

    it('works', (done) => {
      async.series([
        (cb) => store.loadItems('channel', 0, 1, cb),
        (cb) => store.loadItems('channel', 1, 1, cb),
        (cb) => store.loadItems('channel', 3, 2, cb),
        (cb) => store.loadItems('channel', 6, 100, cb),
        (cb) => store.loadItems('channel', 7, 7, cb)
      ], (err, [first, second, twoItems, limitPastEnd, readPastEnd]) => {
        expect(err).to.be.null;

        expect(first).to.have.length(1);
        expect(first[0]).to.have.property('index', 1);

        expect(second).to.have.length(1);
        expect(second[0]).to.have.property('index', 2);

        expect(twoItems).to.have.length(2);
        expect(twoItems[0]).to.have.property('index', 4);
        expect(twoItems[1]).to.have.property('index', 5);

        expect(limitPastEnd).to.have.length(1);
        expect(limitPastEnd[0]).to.have.property('index', 7);

        expect(readPastEnd).to.eql([]);

        done();
      });
    });
  });
});
