const {expect} = require('chai');
const async = require('async');
const lodash = require('lodash');
const redis = require('fakeredis');
const redisStore = require('../src/redis.store');
const utils = require('../src/utils');
const first = (a, b) => a;
const second = (a, b) => b;

describe('redis.store', () => {

  let redisClient, store;
  const item = {};
  const start = 1;
  const DEFAULT_GROUP = group = 'group';

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
      const getIndex = second;
      async.series([addItem, addItem], expects);
    });

  });

  describe('.loadItems', () => {

    it('should succeed when all parameters are defined', (done) => {
      store.loadItems(group, start, (err, msg) => {
        expect(err).to.be.null;
        done();
      });
    });

  });
});
