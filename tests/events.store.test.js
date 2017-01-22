'use strict';

const {expect} = require('chai');
const async = require('async');
const redis = require('fakeredis');
const store = require('../src/events.store');

describe('Add Event', () => {

  let client;
  let event = { channel: 'channel' };
  let params = { channel: event.channel };

  before(done => {
    client = redis.createClient(0, 'localhost');
    client.flushdb();
    done();
  });

  after(done => {
    client.flushdb();
    client.quit();
    done();
  });

  it('should check client parameter', (done) => {
    expect(
      store.addEvent.bind(this, client, event)
    ).to.not.throw('Redis client should be a non-null object');
    expect(
      store.addEvent.bind(this, undefined, event)
    ).to.throw('Redis client should be a non-null object');
    expect(
      store.addEvent.bind(this, null, event)
    ).to.throw('Redis client should be a non-null object');
    done();
  });

  it('should check event parameter', (done) => {
    expect(
      store.addEvent.bind(this, client, event)
    ).to.not.throw('Event should be a non-null object');
    expect(
      store.addEvent.bind(this, client, undefined)
    ).to.throw('Event should be a non-null object');
    expect(
      store.addEvent.bind(this, client, null)
    ).to.throw('Event should be a non-null object');
    expect(
      store.addEvent.bind(this, client, event)
    ).to.not.throw('Event should have channel');
    expect(
      store.addEvent.bind(this, client, {})
    ).to.throw('Event should have channel');
    expect(
      store.addEvent.bind(this, client, event)
    ).to.not.throw('Channel should be a string');
    expect(
      store.addEvent.bind(this, client, {channel: 0})
    ).to.throw('Channel should be a string');
    done();
  });

  it('should provide new ID', (done) => {
    client.flushdb();
    const expects = (err, ids) => {
      let id0 = ids[0].id;
      let id1 = ids[1].id;
      expect(id1).to.equal(id0 + 1);
      done();
    };
    async.series([
      store.addEvent.bind(null, client, event),
      store.addEvent.bind(null, client, event),
    ], expects);
  });

  it('should add events to an empty channel', (done) => {
    client.flushdb();
    const expects = (err, res) => {
      expect(res[2]).to.have.lengthOf(2);
      expect(res[2][0].id).to.equal(1);
      expect(res[2][1].id).to.equal(2);
      done();
    };
    async.series([
      store.addEvent.bind(null, client, event),
      store.addEvent.bind(null, client, event),
      store.getEvents.bind(null, client, params),
    ], expects);
  });

  it('should add events to separate channels', (done) => {
    client.flushdb();
    let diffch = 'diff/channel';
    const expects = (err, res) => {
      expect(res[2]).to.have.lengthOf(1);
      expect(res[2][0].id).to.equal(1);
      expect(res[3]).to.have.lengthOf(1);
      expect(res[3][0].id).to.equal(1);
      done();
    };
    async.series([
      store.addEvent.bind(null, client, event),
      store.addEvent.bind(null, client, { channel: diffch }),
      store.getEvents.bind(null, client, params),
      store.getEvents.bind(null, client, { channel: diffch }),
    ], expects);
  });

});


describe('Get Events', () => {

  let client;
  let params = {
    channel: 'channel',
    after: 0
  };
  let event = { channel: params.channel };

  before(done => {
    client = redis.createClient(0, 'localhost');
    client.flushdb();
    done();
  });

  after(done => {
    client.flushdb();
    client.quit();
    done();
  });

  it('should check client parameter', (done) => {
    expect(
      store.getEvents.bind(this, client, params)
    ).to.not.throw('Redis client should be a non-null object');
    expect(
      store.getEvents.bind(this, undefined, params)
    ).to.throw('Redis client should be a non-null object');
    expect(
      store.getEvents.bind(this, null, params)
    ).to.throw('Redis client should be a non-null object');
    done();
  });

  it('should check params parameter', (done) => {
    expect(
      store.getEvents.bind(this, client, params)
    ).to.not.throw('Parameters should be a non-null object');
    expect(
      store.getEvents.bind(this, client, undefined)
    ).to.throw('Parameters should be a non-null object');
    expect(
      store.getEvents.bind(this, client, null)
    ).to.throw('Parameters should be a non-null object');
    expect(
      store.getEvents.bind(this, client, params)
    ).to.not.throw('Parameters should have channel');
    expect(
      store.getEvents.bind(this, client, {})
    ).to.throw('Parameters should have channel');
    expect(
      store.getEvents.bind(this, client, params)
    ).to.not.throw('Channel should be a string');
    expect(
      store.getEvents.bind(this, client, {channel: 0})
    ).to.throw('Channel should be a string');
    expect(
      store.getEvents.bind(this, client, {channel: '', after: 1})
    ).to.not.throw('After ID should be a number');
    expect(
      store.getEvents.bind(this, client, {channel: '', after: true})
    ).to.throw('After ID should be a number');
    expect(
      store.getEvents.bind(this, client, {channel: '', after: '1'})
    ).to.not.throw('After ID should be a number');
    expect(
      store.getEvents.bind(this, client, {channel: '', after: 'true'})
    ).to.throw('After ID should be a number');
    done();
  });

  it('should return no event from empty channel', (done) => {
    client.flushdb();
    store.getEvents(client, params, (err, events) => {
      expect(events).to.have.lengthOf(0);
      done();
    });
  });

  it('should return all events from a channel', (done) => {
    client.flushdb();
    const expects = (err, res) => {
      expect(res[2]).to.have.lengthOf(2);
      expect(res[2][0].id).to.equal(1);
      expect(res[2][1].id).to.equal(2);
      done();
    };
    async.series([
      store.addEvent.bind(null, client, event),
      store.addEvent.bind(null, client, event),
      store.getEvents.bind(null, client, params),
    ], expects);
  });

  it('should return events only from own channel', (done) => {
    client.flushdb();
    let diffch = 'diff/channel';
    const expects = (err, res) => {
      expect(res[2]).to.have.lengthOf(1);
      expect(res[2][0].id).to.equal(1);
      done();
    };
    async.series([
      store.addEvent.bind(null, client, event),
      store.addEvent.bind(null, client, { channel: diffch }),
      store.getEvents.bind(null, client, params),
    ], expects);
  });

  it('should return no event if after ID is equal to last event', (done) => {
    client.flushdb();
    let diffparams = {
      channel: params.channel,
      after: 3
    };
    const expects = (err, res) => {
      expect(res[3]).to.have.lengthOf(0);
      done();
    };
    async.series([
      store.addEvent.bind(null, client, event),
      store.addEvent.bind(null, client, event),
      store.addEvent.bind(null, client, event),
      store.getEvents.bind(null, client, diffparams),
    ], expects);
  });

  it('should return no event if after ID is beyond last event', (done) => {
    client.flushdb();
    let diffparams = {
      channel: params.channel,
      after: 4
    };
    const expects = (err, res) => {
      expect(res[3]).to.have.lengthOf(0);
      done();
    };
    async.series([
      store.addEvent.bind(null, client, event),
      store.addEvent.bind(null, client, event),
      store.addEvent.bind(null, client, event),
      store.getEvents.bind(null, client, diffparams),
    ], expects);
  });

  it('should return only events after the given ID', (done) => {
    client.flushdb();
    let diffparams = {
      channel: params.channel,
      after: 1
    };
    const expects = (err, res) => {
      expect(res[3]).to.have.lengthOf(2);
      expect(res[3][0].id).to.equal(2);
      expect(res[3][1].id).to.equal(3);
      done();
    };
    async.series([
      store.addEvent.bind(null, client, event),
      store.addEvent.bind(null, client, event),
      store.addEvent.bind(null, client, event),
      store.getEvents.bind(null, client, diffparams),
    ], expects);
  });

});
