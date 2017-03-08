'use strict';

const {expect} = require('chai');
const async = require('async');
const td = require('testdouble');
const {verify, when} = td;
const {anything, isA} = td.matchers;
const {prepareRedisClient} = require('./helper');

describe('redis.pubsub', function() {

  let pubsub;
  let redisPubClient;
  let redisSubClient;
  let callback;
  let handler;

  const OK_CHANNEL = 'ok-channel';
  const FAIL_CHANNEL = 'fail-channel';
  const OK_MESSAGE = 'my-message';

  beforeEach(() => {

    handler = td.function('handler');
    callback = td.function('callback');

    redisPubClient = td.object(['publish']);
    when(redisPubClient.publish(OK_CHANNEL, anything()))
      .thenCallback(null);
    when(redisPubClient.publish(FAIL_CHANNEL, anything()))
      .thenCallback(new Error('publish failed'));

    redisSubClient = td.object(['subscribe', 'on']);
    when(redisSubClient.subscribe(OK_CHANNEL))
      .thenCallback(null);
    when(redisSubClient.subscribe(FAIL_CHANNEL))
      .thenCallback(new Error('subscribe failed'));

    pubsub = require('../src/redis.pubsub').createPubSub({
      redisSubClient,
      redisPubClient
    });
  });

  describe('.publish', () => {

    it('succeeds when message is a string', () => {
      pubsub.publish(OK_CHANNEL, 'abc', callback);
      verify(callback(null));
    });

    it('succeeds when message is a buffer', () => {
      pubsub.publish(OK_CHANNEL, Buffer.from([]), callback);
      verify(callback(null));
    });

    it('succeeds when message is a number', () => {
      pubsub.publish(OK_CHANNEL, 0, callback);
      verify(callback(null));
    });

    it('fails when message is not a valid type', () => {
      pubsub.publish(OK_CHANNEL, {}, callback);
      verify(callback(isA(Error)));
    });

    it('sends message to channel', () => {
      pubsub.publish(OK_CHANNEL, OK_MESSAGE, callback);
      verify(redisPubClient.publish(OK_CHANNEL, OK_MESSAGE, td.callback));
      verify(callback(null));
    });

    it('fails when redisPubClient fails', () => {
      pubsub.publish(FAIL_CHANNEL, OK_MESSAGE, callback);
      verify(callback(isA(Error)));
    });

  });

  describe('.subscribe', () => {

    it('fails when handler is not a function', () => {
      pubsub.subscribe(OK_CHANNEL, {}, callback);
      verify(callback(isA(Error)));
    });

    it('succeeds when handler is a function', () => {
      pubsub.subscribe(OK_CHANNEL, handler, callback);
      verify(callback(null));
    });

    it('fails when redisSubClient fails', () => {
      pubsub.subscribe(FAIL_CHANNEL, handler, callback);
      verify(callback(isA(Error)));
    });
  });

  describe('integration tests', function() {

    let pubsub;
    let redisPubClient;
    let redisSubClient;

    beforeEach(prepareRedisClient((client) => redisPubClient = client));
    beforeEach(prepareRedisClient((client) => redisSubClient = client));
    beforeEach(() => {
      if (redisSubClient && redisPubClient)
        pubsub = require('../src/redis.pubsub').createPubSub({
          redisPubClient, redisSubClient
        });
    });

    afterEach(() => {
      if (redisPubClient)
        redisPubClient.quit();
      if (redisSubClient)
        redisSubClient.quit();
      pubsub = redisSubClient = redisPubClient = null;
    });

    const hasPubSub = () => !!pubsub;

    it('notify subscribers on publish', testableWhen(hasPubSub, (done) => {

      // Create 4 subscribers
      const subscribers = [0, 1, 2, 3].map((index) =>
        td.function(`handler${index}`));

      // Indices of subscribers that we will unsubscribe
      const toUnsubscribe = [0, 1];

      // Indices of subscribers that will stay subscribed
      const keepSubscribed = [2, 3];

      // Subscribe all to OK_CHANNEL
      const ops = subscribers.map((subscriber) =>
        pubsub.subscribe.bind(null, OK_CHANNEL, subscriber))

      // Publish to OK_CHANNEL and FAIL_CHANNEL
      .concat([
        pubsub.publish.bind(null, OK_CHANNEL, OK_MESSAGE),
        pubsub.publish.bind(null, FAIL_CHANNEL, OK_MESSAGE),
        // make sure subscribers were called...
        setTimeout.bind(null, (cb) => {cb();}, 10)
      ])

      // Unsubscribe some from OK_CHANNEL
      .concat(toUnsubscribe.map((i) =>
        pubsub.unsubscribe.bind(null, OK_CHANNEL, subscribers[i])))

      // Publish to OK_CHANNEL again
      .concat([
        pubsub.publish.bind(null, OK_CHANNEL, OK_MESSAGE),
        // make sure subscribers were called...
        setTimeout.bind(null, (cb) => {cb();}, 10)
      ]);

      async.series(ops, (err, results) => {

        expect(err).to.be.null;

        // Those that have been unsubscribed have been called once
        toUnsubscribe.forEach((index) => {
          verify(subscribers[index](OK_MESSAGE), {times: 1});
        });

        // Those that stayed subscribed have been called twice
        keepSubscribed.forEach((index) => {
          verify(subscribers[index](OK_MESSAGE), {times: 2});
        });

        done();
      });
    }));
  });

});
