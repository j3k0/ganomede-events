'use strict';

const td = require('testdouble');
const {expect} = require('chai');
const redis = require('redis');
const config = require('../config');

td.print = (what) => {
  const message = td.explain(what).description;
  console.log('%s', message); // eslint-disable-line no-console
};

global.td = td;
global.expect = expect;

// creates and check a redisClient according to config parameters.
//  - then callback(redisClient)
//  - redisClient will be null if it can't be joined
const prepareRedisClient = (cb) =>
  (done) => {
    const client = redis.createClient({
      port: config.redis.port,
      host: config.redis.host,
      retry_strategy: (options) =>
        new Error('skip-test')
    });
    client.flushdb(function (err) {
      // Connection to redis failed, skipping integration tests.
      if (err && err.origin && err.origin.message === 'skip-test')
        cb(null);
      else
        cb(client);
      done();
    });
  };

// skip a test if isTestRunnable function returns falsy
const testableWhen = (isTestRunnable, test) => {
  // no arrow function here:
  // https://github.com/mochajs/mochajs.github.io/pull/14/files
  return function (done) {
    if (isTestRunnable())
      test(done);
    else
      this.skip();
  };
};

afterEach(() => td.reset());

module.exports = {testableWhen, prepareRedisClient};
