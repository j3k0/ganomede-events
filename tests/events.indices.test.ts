
import { expect } from 'chai';
import supertest from 'supertest';
import { createServer } from '../src/server';
import { config } from '../config';
import { indicesRouter } from '../src/indices.router';
import { parseLatestGetParams } from '../src/parse-http-params';
import { RedisClient } from 'redis';
import { Server } from 'restify';
import td from 'testdouble';
import { EventsStore } from '../src/events.store';


const { anything } = td.matchers;
const { when } = td;
const url = `${config.http.prefix}/indices`;
const SOME_CHANNEL = 'some-channel';
const INDEX_ID = 'ANY_INDEX';
const INDEX_VALUE = 'THE_VALUE';
const CREATE_INDEX_REQ_BODY = {
  secret: process.env.API_SECRET,
  "id": "blocked-users-by-username",
  "channel": "users/v1/blocked-users",
  "field": "data.username"
};

describe('events.indices check api', () => {

  let server: Server | null = null;
  let store: EventsStore | null;
  let redisClient: RedisClient | null;

  beforeEach(done => {

    redisClient = td.object(['zrange', 'mget', 'duplicate', 'on']) as RedisClient;
    store = td.object(['addEvent', 'loadLatestItems']) as EventsStore;

    let rediPubSubClient: RedisClient = td.object(['zrange', 'mget', 'duplicate', 'on']) as RedisClient;

    td.when(redisClient.duplicate()).thenReturn(rediPubSubClient);

    server = createServer();
    indicesRouter(config.http.prefix, server, redisClient, store);
    server.listen(done);
  });

  afterEach(done => {
    // redisClient.quit();
    server!.close(done);
    store = redisClient = null;
  });

  it("expects the server to have a get method for getting an index", (done: Mocha.Done) => {

    let getUrl = [url, INDEX_ID, INDEX_VALUE].join('/');

    supertest(server)
      .get(getUrl)
      .query({ secret: process.env.API_SECRET })
      .expect(200)
      .end((err, res) => {
        expect(res.status).to.equal(200);
        done();
      });
  });

  it("expects the server to have a post method for saving an index", (done: Mocha.Done) => {

    supertest(server)
      .post(url)
      .send(CREATE_INDEX_REQ_BODY)
      .expect(200)
      .end((err, res) => {
        expect(res.status).to.equal(200);
        done();
      });
  });


});
