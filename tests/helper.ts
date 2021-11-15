'use strict';

import td from 'testdouble';
import {expect} from 'chai';
import redis from 'redis';
import {config} from '../config';

td['print'] = (what) => {
  const message = td.explain(what).description;
  console.log('%s', message); // eslint-disable-line no-console
};

//global.td = td;
//global.expect = expect;

// creates and check a redisClient according to config parameters.
//  - then callback(redisClient)
//  - redisClient will be null if it can't be joined
export const prepareRedisClient = (cb) =>
  (done) => {
    const client = redis.createClient({
      port: config.redis.port,
      host: config.redis.host,
      retry_strategy: (options) =>
        new Error('skip-test')
    });
    client.flushdb(function (err) {
      // Connection to redis failed, skipping integration tests.
      if (err && err['origin'] && err['origin'].message === 'skip-test')
        cb(null);
      else
        cb(client);
      done();
    });
  };

// skip a test if isTestRunnable function returns falsy
export const testableWhen = (isTestRunnable, test) => {
  // no arrow function here:
  // https://github.com/mochajs/mochajs.github.io/pull/14/files
  let that = this;
  return function (done) {
    if (isTestRunnable())
      test(done);
    else
      (that as any).skip();
  };
};

afterEach(() => td.reset());