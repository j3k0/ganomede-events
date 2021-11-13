// unit tests for events.middleware.get

'use strict';


const {expect} = require('chai');
const supertest = require('supertest');
const createServer = require('../src/server');
const config = require('../config');
const latest = require('../src/latest.router');
const {parseLatestGetParams} = require('../src/parse-http-params');
const redis = require('redis');
const url = `${config.http.prefix}/latest`;

const NON_EMPTY_CHANNEL = 'non-empty-channel';

let redisClient;

describe('Testing ParseLatestGetParams', () => {
  it('Empty params to be null', () => {
    const parsed = parseLatestGetParams();
    expect(parsed).to.be.instanceof(Error);
  });

  it('defaults channel/limit to ' + NON_EMPTY_CHANNEL + '/100', () => {
    const parsed = parseLatestGetParams({channel: NON_EMPTY_CHANNEL});
    expect(parsed).to.eql({
      channel: NON_EMPTY_CHANNEL,
      limit: 100
    });
  });

  it('Params channel/limit to ' + NON_EMPTY_CHANNEL + '/20', () => {
    const parsed = parseLatestGetParams({channel: NON_EMPTY_CHANNEL, limit: 20});
    expect(parsed).to.eql({
      channel: NON_EMPTY_CHANNEL,
      limit: 20
    });
  });

  it('channel must be non-empty string', () => {
    const t = (input) => {
      const actual = parseLatestGetParams(input);
      expect(actual).to.be.instanceof(Error);
      expect(actual.message).to.equal('Invalid Channel');
    };

    t({});
    t({channel: ''});
    t({channel: 42});
    t({channel: false});
    t({channel: undefined});
  });
});

describe.skip('events.latest.get', () => {

  const server = createServer();

  before(done => {
    const retry_strategy = (options) =>
        new Error('skip-test');
    redisClient = redis.createClient(config.redis.port, config.redis.host, {retry_strategy});
    redisClient.duplicate = () =>
        redisClient = redis.createClient(config.redis.port, config.redis.host, {retry_strategy});

    latest(config.http.prefix, server, redisClient);
    redisClient.info((err) => {
        // Connection to redis failed, skipping integration tests.
      if (err && err.origin && err.origin.message === 'skip-test')
        this.skip();
      else
          server.listen(done);
    });
  });

  after(done => {
    redisClient.quit();
    server.close(done);
  });

  const testUrl = (url) => {
    it(`GET ${url}`, (done) => {
      supertest(server)
          .get(url)
          .expect(200)
          .query({channel: NON_EMPTY_CHANNEL})
          .end((err, res) => {
            expect(res.status).to.equal(200);
            expect(err).to.be.null;
            done();
          });
    });
  };

  testUrl(url);


  const testRequestParams = (url) => {
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

  testRequestParams(url);

});
