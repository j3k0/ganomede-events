'use strict';

const async = require('async');
const redis = require('redis');
const {createStore} = require('../src/redis.store');

describe('redis.store', () => {
  const redisClient = redis.createClient();
  const store = createStore({redisClient});

  after(done => redisClient.flushdb(done));
  after(done => redisClient.quit(done));

  describe('#nextIndex()', () => {
    it('returns index for a channel', (done) => {
      const redisClient = td.object(['incr']);
      const store = createStore({redisClient});

      td.when(redisClient.incr('indices:channel', td.callback))
        .thenCallback(null, 1);

      store.nextIndex('channel', done);
    });
  });

  describe('#addItem()', () => {
    before(done => redisClient.flushdb(done));
    const id = 1;

    it('saves json string to channel:json.id', (done) => {
      store.addItem('channel', {id}, (err, results) => {
        expect(err).to.be.null;
        expect(results).to.eql([
          'OK', // set okay
          1     // pushed 1 item
        ]);
        done();
      });
    });

    it('does not overwrite existing ids', (done) => {
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
  });

  describe('#loadItems()', () => {
    before(done => redisClient.flushdb(done));
    before((done) => {
      let currentId = 1;
      async.times(
        7,
        (id, cb) => store.addItem('channel', {id: currentId++}, cb),
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
    });
  });
});
