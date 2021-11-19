
import {expect} from 'chai';

import async from 'async';
import td from 'testdouble';
import {PubSub}  from '../src/redis.pubsub';
import {prepareRedisClient, testableWhen} from './helper';
import { RedisClient } from 'redis';
const {verify, when} = td;
const {anything, isA} = td.matchers;

describe('redis.pubsub', function () {

  let pubsub: PubSub;
  let redisPubClient: RedisClient;
  let redisSubClient: RedisClient;
  let callback: (e: Error | null) => void;
  let handler: (message:string) => void;

  const OK_CHANNEL = 'ok-channel';
  const FAIL_CHANNEL = 'fail-channel';
  const OK_MESSAGE = 'my-message';

  beforeEach(() => {

    handler = td.function('handler') as (message:string) => void;
    callback = td.function('callback') as (e: Error | null) => void;

    redisPubClient = td.object(['publish']) as RedisClient;
    when(redisPubClient.publish(OK_CHANNEL, anything()))
      .thenCallback(null);
    when(redisPubClient.publish(FAIL_CHANNEL, anything()))
      .thenCallback(new Error('publish failed'));

    redisSubClient = td.object(['subscribe', 'on']) as RedisClient;
    when(redisSubClient.subscribe(OK_CHANNEL))
      .thenCallback(null);
    when(redisSubClient.subscribe(FAIL_CHANNEL))
      .thenCallback(new Error('subscribe failed'));

    pubsub = new PubSub(
      redisPubClient,
      redisSubClient
    );
  });

  describe('.publish', () => {

    it('succeeds when message is a string', () => {
      pubsub.publish(OK_CHANNEL, 'abc', callback);
      verify(callback(null));
    });

    it('succeeds when message is a buffer', () => {
      pubsub.publish(OK_CHANNEL, Buffer.from([]) as any, callback);
      verify(callback(null));
    });

    it('succeeds when message is a number', () => {
      pubsub.publish(OK_CHANNEL, 0 as any, callback);
      verify(callback(null));
    });

    it('fails when message is not a valid type', () => {
      pubsub.publish(OK_CHANNEL, {} as any, callback);
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
      pubsub.subscribe(OK_CHANNEL, {} as any, callback);
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

  describe('integration tests', function () {

    let pubsub: PubSub|null;
    let redisPubClient: RedisClient|null;
    let redisSubClient: RedisClient|null;

    beforeEach(prepareRedisClient((client) => redisPubClient = client));
    beforeEach(prepareRedisClient((client) => redisSubClient = client));
    beforeEach(() => {
      if (redisSubClient && redisPubClient)
        pubsub = new PubSub(
          redisPubClient, redisSubClient
        );
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

      when(redisPubClient?.publish(anything(), anything()))
      .thenCallback(null);

      when(redisSubClient?.subscribe(anything()))
      .thenCallback(null);
 

      // Create 4 subscribers
      const subscribers = [0, 1, 2, 3].map((index) =>
        td.function(`handler${index}`));

      // Indices of subscribers that we will unsubscribe
      const toUnsubscribe = [0, 1];

      // Indices of subscribers that will stay subscribed
      const keepSubscribed = [2, 3];

      // Subscribe all to OK_CHANNEL
      const ops: (((cb: (e: Error | null) => void) => void) | undefined)[] = subscribers.map((subscriber) =>
        pubsub?.subscribe.bind(pubsub, OK_CHANNEL, subscriber as any))

      // Publish to OK_CHANNEL and FAIL_CHANNEL
      .concat([
        pubsub?.publish.bind(pubsub, OK_CHANNEL, OK_MESSAGE),
        pubsub?.publish.bind(pubsub, FAIL_CHANNEL, OK_MESSAGE),
        cb => { (redisSubClient as any).callHandlers('message', OK_CHANNEL, OK_MESSAGE); cb(null) },
        cb => { (redisSubClient as any).callHandlers('message', FAIL_CHANNEL, OK_MESSAGE); cb(null) },
        // make sure subscribers were called...
        cb => setTimeout(cb, 10)
      ])

      // Unsubscribe some from OK_CHANNEL
      .concat(toUnsubscribe.map((i) =>
        pubsub?.unsubscribe.bind(pubsub, OK_CHANNEL, subscribers[i] as any)))

      // Publish to OK_CHANNEL again
      .concat([
        pubsub?.publish.bind(pubsub, OK_CHANNEL, OK_MESSAGE),
        cb => { (redisSubClient as any).callHandlers('message', OK_CHANNEL, OK_MESSAGE); cb(null) },
        // make sure subscribers were called...
        cb => setTimeout(cb, 10)
      ]);

      
      async.series(ops as any, (err, results) => {
        
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
