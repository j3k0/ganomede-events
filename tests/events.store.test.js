const {expect} = require('chai');
const async = require('async');
const redis = require('fakeredis');
const eventsStore = require('../src/events.store');
const utils = require('../src/utils');

describe('events.store', () => {

  let redisClient, store;
  const event = {};
  const afterId = 0;
  const channel = 'channel';

  const addEvent = (channel, event) => (callback) =>
  store.addEvent(channel, event, callback);

  addTwoEvents = (channel, event) => [
    addEvent(channel, event), addEvent(channel, event)];

  addThreeEvents = (channel, event) => [
    addEvent(channel, event), addEvent(channel, event),
    addEvent(channel, event)];

  const loadEvents = (channel, id) => (callback) =>
  store.loadEvents(channel, id, callback);

  beforeEach(done => {
    redisClient = redis.createClient(0, 'localhost');
  // TODO: use a mockup
    itemsStore = require('../src/redis.store').createStore({redisClient});
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
      addTwoEvents(channel, event).concat(loadEvents(channel, 0)),
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
        loadEvents(channel, 0),
        loadEvents(otherChannel, 0),
      ], expects);
    });

  });


  describe('.loadEvents', () => {

    it('should not return an error when channel is a string', (done) => {
      store.loadEvents(channel, afterId, (err, msg) => {
        expect(err).to.be.null;
        done();
      });
    });

    it('should return an error when channel is undefined', (done) => {
      store.loadEvents(undefined, afterId, (err, msg) => {
        expect(err).to.not.be.null;
        done();
      });
    });

    it('should return an error when channel is not a string', (done) => {
      store.loadEvents(0, afterId, (err, msg) => {
        expect(err).to.not.be.null;
        done();
      });
    });

    it('should not return an error when after ID is a number', (done) => {
      store.loadEvents(channel, afterId, (err, msg) => {
        expect(err).to.be.null;
        done();
      });
    });

    it('should not return an error when after ID is string parseable to number', (done) => {
      store.loadEvents(channel, '1', (err, msg) => {
        expect(err).to.be.null;
        done();
      });
    });

    it('should not return an error when after ID is undefined', (done) => {
      store.loadEvents(channel, undefined, (err, msg) => {
        expect(err).to.be.null;
        done();
      });
    });

    it('should return an error when after ID is not valid', (done) => {
      store.loadEvents(channel, 'true', (err, msg) => {
        expect(err).to.not.be.null;
        done();
      });
    });

    it('should return no event from empty channel', (done) => {
      store.loadEvents(channel, afterId, (err, events) => {
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
        .concat(loadEvents(channel, afterId))
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
        loadEvents(channel, afterId),
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
        .concat(loadEvents(channel, 3)),
      expects);
    });

    it('should return no event if after ID is beyond last event', (done) => {
      const expects = (err, res) => {
        expect(res[3]).to.have.lengthOf(0);
        done();
      };
      async.series(
      addThreeEvents(channel, event)
        .concat(loadEvents(channel, 4)),
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
        .concat(loadEvents(channel, 1)),
      expects);
    });

  });
});
