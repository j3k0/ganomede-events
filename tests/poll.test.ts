'use strict';

const {createPoll} = require('../src/poll');
import td from 'testdouble';
const {verify, when} = td;
const {isA} = td.matchers;
const calledOnce = {times: 1, ignoreExtraArgs: true};

describe('poll', () => {

  const CHANNEL = 'channel';
  const MESSAGE = 'message';
  const POLL_TIMEOUT = 321;
  const TIMEOUT_ID = 1;
  let callback;
  let log;
  let poll;
  let pubsub;
  let setTimeout;
  let clearTimeout;

  beforeEach(() => {
    callback = td.function('callback');
    pubsub = td.object(['subscribe', 'publish', 'unsubscribe']);
    setTimeout = td.function('setTimeout');
    clearTimeout = td.function('clearTimeout');
    log = td.object(['error']);
    poll = createPoll({
      pubsub,
      log,
      setTimeout,
      clearTimeout,
      pollTimeout: POLL_TIMEOUT
    });
  });

  describe('.emit', () => {

    it('publishes the message', () => {
      poll.emit(CHANNEL, MESSAGE, callback);
      verify(pubsub.publish(CHANNEL, MESSAGE, isA(Function)));
    });
  });

  describe('.listen', () => {

    it('subscribes a handler to pubsub', () => {
      poll.listen(CHANNEL, callback);
      verify(pubsub.subscribe(CHANNEL, isA(Function), isA(Function)));
    });

    it('adds a timeout', () => {
      poll.listen(CHANNEL, callback);
      verify(setTimeout(isA(Function), POLL_TIMEOUT));
    });

    it('reports a null message on timeout', (done) => {
      when(setTimeout(isA(Function), isA(Number)))
        .thenDo((cb) => {
          setImmediate(cb);
          return TIMEOUT_ID;
        });
      poll.listen(CHANNEL, callback);
      setImmediate(() => {
        verify(callback(null, null));
        // and cleanup is done
        verify(clearTimeout(TIMEOUT_ID));
        verify(pubsub.unsubscribe(CHANNEL, isA(Function), isA(Function)));
        verify(callback(), calledOnce);
        done();
      });
    });

    it('reports channel messages', (done) => {
      when(pubsub.subscribe(CHANNEL, isA(Function), isA(Function)))
        .thenDo((_, cb) => {
          setImmediate(() => cb(MESSAGE));
        });
      when(setTimeout(isA(Function), isA(Number)))
        .thenReturn(TIMEOUT_ID);
      poll.listen(CHANNEL, callback);
      setImmediate(() => {
        verify(callback(null, MESSAGE));
        // and cleanup is done
        verify(clearTimeout(TIMEOUT_ID));
        verify(pubsub.unsubscribe(CHANNEL, isA(Function), isA(Function)));
        verify(callback(), calledOnce);
        done();
      });
    });

  });
});
