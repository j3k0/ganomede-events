'use strict';

const {expect} = require('chai');
const async = require('async');
const redis = require('fakeredis');
const eventsStore = require('../src/events.store');

describe('events.store', () => {

  let redisClient;
  let store;
  const lim = 100;
  const event = {};
  const afterId = 0;
  const channel = 'channel';

  const addEvent = (channel, event) => (callback) =>
  store.addEvent(channel, event, callback);

  const addTwoEvents = (channel, event) => [
    addEvent(channel, event), addEvent(channel, event)];

  const addThreeEvents = (channel, event) => [
    addEvent(channel, event), addEvent(channel, event),
    addEvent(channel, event)];

  const loadEvents = (channel, id) => (callback) =>
  store.loadEvents(channel, id, lim, callback);

  beforeEach(done => {
    redisClient = redis.createClient(0, 'localhost');
  // TODO: use a mockup
    const itemsStore = require('../src/redis.store').createStore({redisClient});
    store = eventsStore.createStore({itemsStore});
    redisClient.flushdb(done);
  });

  afterEach(done => {
    redisClient.flushdb(() => {
      redisClient.quit();
      done();
    });
  });

  describe('.addEvent', () => {

    it('should succeed when event is defined', (done) => {
      store.addEvent(channel, event, (err, msg) => {
        expect(err).to.be.null;
        done();
      });
    });

    it('should return an error when event is undefined', (done) => {
      store.addEvent(channel, undefined, (err, msg) => {
        expect(err).to.not.be.null;
        done();
      });
    });

    it('should return an error when event is null', (done) => {
      store.addEvent(channel, null, (err, msg) => {
        expect(err).to.not.be.null;
        done();
      });
    });

    it('should succeed when channel is a string', (done) => {
      store.addEvent(channel, event, (err, msg) => {
        expect(err).to.be.null;
        done();
      });
    });

    it('should return an error when channel is undefined', (done) => {
      store.addEvent(undefined, event, (err, msg) => {
        expect(err).to.not.be.null;
        done();
      });
    });

    it('should return an error when channel is not a string', (done) => {
      store.addEvent(0, event, (err, msg) => {
        expect(err).to.not.be.null;
        done();
      });
    });

    it('should provide new IDs', (done) => {
      const expects = (err, ids) => {
        const id0 = ids[0].id;
        const id1 = ids[1].id;
        expect(id0).to.equal(1);
        expect(id1).to.equal(2);
        done();
      };

      async.series(addTwoEvents(channel, event), expects);
    });

    it('should add events to an empty channel', (done) => {
      const expects = (err, res) => {
        const events = res[2];
        expect(events).to.have.lengthOf(2);
        expect(events[0].id).to.equal(1);
        expect(events[1].id).to.equal(2);
        done();
      };

      async.series(
      addTwoEvents(channel, event).concat(loadEvents(channel, 0, lim)),
      expects);
    });

    it('should add events to separate channels', (done) => {
      const otherChannel = 'diff/channel';
      const expects = (err, res) => {
        const events = res[2];
        const otherEvents = res[3];
        expect(events).to.have.lengthOf(1);
        expect(events[0].id).to.equal(1);
        expect(otherEvents).to.have.lengthOf(1);
        expect(otherEvents[0].id).to.equal(1);
        done();
      };
      async.series([
        addEvent(channel, event),
        addEvent(otherChannel, event),
        loadEvents(channel, 0, lim),
        loadEvents(otherChannel, 0, lim),
      ], expects);
    });

  });


  describe('.loadEvents', () => {

    it('should not return an error when channel is a string', (done) => {
      store.loadEvents(channel, afterId, lim, (err, msg) => {
        expect(err).to.be.null;
        done();
      });
    });

    it('should return an error when channel is undefined', (done) => {
      store.loadEvents(undefined, afterId, lim, (err, msg) => {
        expect(err).to.not.be.null;
        done();
      });
    });

    it('should return an error when channel is not a string', (done) => {
      store.loadEvents(0, afterId, lim, (err, msg) => {
        expect(err).to.not.be.null;
        done();
      });
    });

    it('should not return an error when after ID is a number', (done) => {
      store.loadEvents(channel, afterId, lim, (err, msg) => {
        expect(err).to.be.null;
        done();
      });
    });

    it('should not return an error when after ID is string parseable to number', (done) => {
      store.loadEvents(channel, '1', lim, (err, msg) => {
        expect(err).to.be.null;
        done();
      });
    });

    it('should not return an error when after ID is undefined', (done) => {
      store.loadEvents(channel, undefined, lim, (err, msg) => {
        expect(err).to.be.null;
        done();
      });
    });

    it('should return an error when after ID is not valid', (done) => {
      store.loadEvents(channel, 'true', lim, (err, msg) => {
        expect(err).to.not.be.null;
        done();
      });
    });

    it('should return no event from empty channel', (done) => {
      store.loadEvents(channel, afterId, lim, (err, events) => {
        expect(events).to.have.lengthOf(0);
        done();
      });
    });

    it('should return all events from a channel', (done) => {
      const expects = (err, res) => {
        const events = res[2];
        expect(events).to.have.lengthOf(2);
        expect(events[0].id).to.equal(1);
        expect(events[1].id).to.equal(2);
        done();
      };
      async.series(
      addTwoEvents(channel, event)
        .concat(loadEvents(channel, afterId, lim))
      , expects);
    });

    it('should return events only from own channel', (done) => {
      const otherChannel = 'diff/channel';
      const expects = (err, res) => {
        const events = res[2];
        expect(events).to.have.lengthOf(1);
        expect(events[0].id).to.equal(1);
        done();
      };
      async.series([
        addEvent(channel, event),
        addEvent(otherChannel, event),
        loadEvents(channel, afterId, lim),
      ], expects);
    });

    it('should return no event if after ID is equal to last event', (done) => {
      const expects = (err, res) => {
        const events = res[3];
        expect(events).to.have.lengthOf(0);
        done();
      };
      async.series(
      addThreeEvents(channel, event)
        .concat(loadEvents(channel, 3, lim)),
      expects);
    });

    it('should return no event if after ID is beyond last event', (done) => {
      const expects = (err, res) => {
        expect(res[3]).to.have.lengthOf(0);
        done();
      };
      async.series(
      addThreeEvents(channel, event)
        .concat(loadEvents(channel, 4, lim)),
      expects);
    });

    it('should return only events after the given ID', (done) => {
      const expects = (err, res) => {
        const events = res[3];
        expect(events).to.have.lengthOf(2);
        expect(events[0].id).to.equal(2);
        expect(events[1].id).to.equal(3);
        done();
      };
      async.series(
      addThreeEvents(channel, event)
        .concat(loadEvents(channel, 1, lim)),
      expects);
    });

    it('should not return an error when limit is a string', (done) => {
      store.addThreeEvents(channel, event);
      store.loadEvents(channel, afterId, 'random@string', (err, msg) => {
        expect(err).to.be.null;
        done();
      });
    });

    it('should not return an error when limit is undefined', (done) => {
      store.loadEvents(channel, afterId, undefined, (err, msg) => {
        expect(err).to.be.null;
        done();
      });
    });

    it('should not return an error when limit is digital null', (done) => {
      store.loadEvents(channel, afterId, 0, (err, msg) => {
        expect(err).to.be.null;
        done();
      });
    });

    it('should not return an error when limit is null', (done) => {
      store.loadEvents(channel, afterId, null, (err, msg) => {
        expect(err).to.be.null;
        done();
      });
    });

    it('should not return an error when limit is a number', (done) => {
      store.loadEvents(channel, afterId, lim, (err, msg) => {
        expect(err).to.be.null;
        done();
      });
    });
  });
});
