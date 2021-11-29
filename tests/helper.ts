
import td from 'testdouble';
import { RedisClient } from 'redis'

(td as any)['print'] = (what: any) => {
  const message = td.explain(what).description;
  console.log('%s', message); // eslint-disable-line no-console
};

//global.td = td;
//global.expect = expect;

// creates and check a redisClient according to config parameters.
//  - then callback(redisClient)
//  - redisClient will be null if it can't be joined
export const prepareRedisClient = (cb: (r: RedisClient) => void) =>
  (done: () => void) => {


    let redisClient: any = td.object(['zrange', 'mget', 'quit', 'set', 'on', 'subscribe', 'multi', 'get', 'publish', 'subscribe']);
    const handlers: { [type: string]: Array<(channel: string, message: string) => void> } = {};
    redisClient.on = (type: string, handler: (channel: string, message: string) => void) => {
      handlers[type] = (handlers[type] || []).concat(handler);
    }
    redisClient.callHandlers = (type: string, channel: string, message: string): void => {
      handlers[type].forEach(handler => handler(channel, message));
    }
    cb(redisClient);
    done();

    // const client = redis.createClient({
    //   port: config.redis.port,
    //   host: config.redis.host,
    //   retry_strategy: (options) =>
    //     new Error('skip-test')
    // });
    // client.flushdb(function (err) {
    //   // Connection to redis failed, skipping integration tests.
    //   if (err && err['origin'] && err['origin'].message === 'skip-test')
    //     cb(null);
    //   else
    //     cb(client);
    //   done();
    // });
  };

// skip a test if isTestRunnable function returns falsy
export const testableWhen = (isTestRunnable: () => boolean, test: (x: () => void) => void) => {
  // no arrow function here:
  // https://github.com/mochajs/mochajs.github.io/pull/14/files
  let that = this;
  return function (done: () => void) {
    if (isTestRunnable())
      test(done);
    else
      (that as any).skip && (that as any).skip();
  };
};

afterEach(() => td.reset());
