// unit tests for events.middleware.get

import { expect } from 'chai';
import supertest from 'supertest';
import { createServer } from '../src/server';
import { config } from '../config';
import { latest } from '../src/latest.router';
import { parseLatestGetParams } from '../src/parse-http-params';
import { RedisClient } from 'redis';
import td from 'testdouble';

const url = `${config.http.prefix}/latest`;

const NON_EMPTY_CHANNEL = 'non-empty-channel';

let redisClient: RedisClient;

describe('parse-http-params', () => {
  it('Expects a configuration object to be passed', () => {
    const parsed = parseLatestGetParams();
    expect(parsed).to.be.instanceof(Error);
  });

  it('Set the limits to 100 be default', () => {
    const parsed = parseLatestGetParams({ channel: NON_EMPTY_CHANNEL });
    expect(parsed).to.eql({
      channel: NON_EMPTY_CHANNEL,
      limit: 100
    });
  });

  it('Use the provided limit in the config object', () => {
    const parsed = parseLatestGetParams({ channel: NON_EMPTY_CHANNEL, limit: 20 });
    expect(parsed).to.eql({
      channel: NON_EMPTY_CHANNEL,
      limit: 20
    });
  });

  it('Expect the channel to  be non-empty string', () => {
    const t = (input: any) => {
      const actual = parseLatestGetParams(input);
      expect(actual).to.be.instanceof(Error);
      expect((actual as Error).message).to.equal('Invalid Channel');
    };

    t({});
    t({ channel: '' });
    t({ channel: 42 });
    t({ channel: false });
    t({ channel: undefined });
  });
});

describe('events.latest.get', () => {

  const server = createServer();

  before(done => {
    /*
    const retry_strategy = (options) =>
        new Error('skip-test');
    redisClient = redis.createClient(config.redis.port, config.redis.host, {retry_strategy});
    redisClient.duplicate = () =>
        redisClient = redis.createClient(config.redis.port, config.redis.host, {retry_strategy});

    redisClient.info((err) => {
      // Connection to redis failed, skipping integration tests.
      if (err && err.origin && err.origin.message === 'skip-test')
        (this as any).skip();
      else
        server.listen(done);
    });

    this.redis.zrange(key(channel, KEYS), -limit, -1, callback);
    const pullAllItems = (keys, callback) => {
      return keys.length > 0
        ? this.redis.mget(keys, callback)

    */
    redisClient = td.object(['zrange', 'mget']) as RedisClient;
    latest(config.http.prefix, server, redisClient);
    server.listen(done);
  });

  after(done => {
    // redisClient.quit();
    server.close(done);
  });

  it(`returns the list of events for non-empty channel`, (done) => {

    td.when(redisClient.zrange(`${NON_EMPTY_CHANNEL}:keys`, -1, -1, td.callback))
      .thenCallback(null, ['my-event-id']);

    td.when(redisClient.mget(['my-event-id'], td.callback))
      .thenCallback(null, ['{"stuff":"things"}']);

    supertest(server)
      .get(url)
      .expect(200)
      .query({ channel: NON_EMPTY_CHANNEL, limit: 1, secret: process.env.API_SECRET })
      .end((err, res) => {
        expect(JSON.stringify(res.body)).to.equal('[{"stuff":"things"}]');
        expect(err).to.be.null;
        expect(res.status).to.equal(200);
        done();
      });
  });

  it(`fails with 401 if API_SECRET is incorrect`, (done) => {
    supertest(server)
      .get(url)
      .expect(401)
      .query({ channel: NON_EMPTY_CHANNEL, limit: 1 })
      .end((err, res) => {
        expect(res.status).to.equal(401);
        done();
      });
  });

  /*const testRequestParams = (url) => {
    it(`Test-Params ${url} `, (done) => {
      supertest(server)
            .get(url)
            .query({channel: NON_EMPTY_CHANNEL})
            .expect(200)
            .end((err, res) => {
              expect(res.status).to.equal(200);
              expect(err).to.be.null;
              expect(res.body).to.be.instanceof(Array);
              done();
            });
    });
  };

  testRequestParams(url);*/

});
