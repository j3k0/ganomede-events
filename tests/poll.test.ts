
import { Poll } from '../src/poll';
import td from 'testdouble';
import { PubSub } from '../src/redis.pubsub';
import Logger from 'bunyan';
const { verify, when } = td;
const { isA } = td.matchers;
const calledOnce = { times: 1, ignoreExtraArgs: true };

describe('poll', () => {

  const CHANNEL = 'channel';
  const MESSAGE = 'message';
  const POLL_TIMEOUT: number = 321;
  const TIMEOUT_ID = 1;
  let callback: (e?: Error | null, d?: any) => void;
  let log: Logger;
  let poll: Poll;
  let pubsub: PubSub;
  let setTimeout: typeof global.setTimeout;
  let clearTimeout: typeof global.clearTimeout;

  beforeEach(() => {
    callback = td.function('callback') as ((e?: Error | null, d?: any) => void);
    pubsub = td.object(['subscribe', 'publish', 'unsubscribe']) as PubSub;
    setTimeout = td.function('setTimeout') as (typeof global.setTimeout);
    clearTimeout = td.function('clearTimeout') as (typeof global.clearTimeout);
    log = td.object(['error']) as Logger;
    poll = new Poll({
      pubsub,
      log,
      pollTimeout: POLL_TIMEOUT,
      setTimeout,
      clearTimeout
    }
    );
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
        .thenDo((cb: () => void) => {
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
        .thenDo((_: any, cb: (d: string) => void) => {
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
