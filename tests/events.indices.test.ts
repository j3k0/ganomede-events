
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
import { RedisStore } from '../src/redis.store';

const url = `${config.http.prefix}/indices`;
const SOME_CHANNEL = 'users/v1/blocked-users';
const INDEX_ID = 'blocked-users-by-username';
const INDEX_VALUE = 'value-OfIndex';
const CREATE_INDEX_REQ_BODY = {
  id: INDEX_ID,
  channel: SOME_CHANNEL,
  field: "data.username"
};

const EVENTS_ARRAY = [
  { id: 1, data: { username: 'value-OfIndex', age: 21 } },
  { id: 2, data: { username: 'value-OfIndex2', age: 23 } },
  { id: 3, data: { username: 'value-OfIndex', age: 34 } }
];

describe('events.indices check api', () => {

  let server: Server | null = null;
  let store: EventsStore | null;
  let rediSstore: RedisStore | null;
  let redisClient: RedisClient | null;

  beforeEach(done => {

    redisClient = td.object(['zrange', 'mget', 'duplicate', 'on', 'get', 'set',
      'zrangebyscore', 'mget', 'multi', 'lpush', 'lrange']) as RedisClient;
    rediSstore = new RedisStore(redisClient);
    store = new EventsStore(rediSstore);

    let rediPubSubClient: RedisClient = td.object(['zrange', 'mget', 'duplicate', 'on']) as RedisClient;

    td.when(redisClient.duplicate()).thenReturn(rediPubSubClient);

    server = createServer();
    indicesRouter(config.http.prefix, server, redisClient, store);
    server.listen(done);
  });

  afterEach(done => {
    // redisClient.quit();
    server!.close(done);
    store = redisClient = rediSstore = null;
  });

  it(`expects to return 2 events out of 3 for the value '${INDEX_VALUE}'`, (done: Mocha.Done) => {

    let getUrl = [url, INDEX_ID, INDEX_VALUE].join('/');

    td.when(redisClient?.get(`indices:${INDEX_ID}`, td.callback)).
      thenCallback(null, JSON.stringify(CREATE_INDEX_REQ_BODY));
    td.when(redisClient?.get(`last-fetched:${INDEX_ID}:${SOME_CHANNEL}`, td.callback)).
      thenCallback(null, 4);
    td.when(redisClient?.set(td.matchers.anything(), td.matchers.anything(), td.callback)).
      thenCallback(null, null);

    td.when(redisClient?.zrangebyscore(td.matchers.anything(), td.matchers.anything(),
      td.matchers.anything(), td.matchers.anything(), td.matchers.anything(),
      td.matchers.anything(), td.callback)).
      thenCallback(null, [`${SOME_CHANNEL}:1`, `${SOME_CHANNEL}:2`, `${SOME_CHANNEL}:3`]);

    td.when(redisClient?.mget([`${SOME_CHANNEL}:1`, `${SOME_CHANNEL}:2`, `${SOME_CHANNEL}:3`], td.callback)).
      thenCallback(null, [
        JSON.stringify(EVENTS_ARRAY[0]),
        JSON.stringify(EVENTS_ARRAY[1]),
        JSON.stringify(EVENTS_ARRAY[2])
      ]);

    td.when(redisClient?.multi(td.callback as any))
      .thenCallback(null, ['OK']);

    td.when(redisClient?.lpush(`index:${INDEX_ID}:value-OfIndex`, String(1), td.callback)).
      thenCallback(null, 1);

    td.when(redisClient?.lpush(`index:${INDEX_ID}:value-OfIndex2`, String(2), td.callback)).
      thenCallback(null, 2);

    td.when(redisClient?.lpush(`index:${INDEX_ID}:value-OfIndex`, String(3), td.callback)).
      thenCallback(null, 3);

    td.when(redisClient?.lrange(`index:${INDEX_ID}:${INDEX_VALUE}`, td.matchers.anything(), td.matchers.anything(),
      td.callback)).thenCallback(null, ["1", "3"]);

    td.when(redisClient?.mget([`${SOME_CHANNEL}:1`, `${SOME_CHANNEL}:3`], td.callback)).
      thenCallback(null, [
        JSON.stringify(EVENTS_ARRAY[0]),
        JSON.stringify(EVENTS_ARRAY[2])
      ]);

    supertest(server)
      .get(getUrl)
      .query({ secret: process.env.API_SECRET })
      .expect(200)
      .end((err, res) => {
        expect(res.status).to.equal(200);
        expect(res.body).to.eql({
          id: "blocked-users-by-username",
          field: "data.username",
          value: INDEX_VALUE,
          rows: [EVENTS_ARRAY[0], EVENTS_ARRAY[2]]
        });
        done();
      });
  });

  it("expects the server to have a post method for saving an index", (done: Mocha.Done) => {

    const sendData = Object.assign(
      { secret: process.env.API_SECRET }, CREATE_INDEX_REQ_BODY);

    td.when(redisClient?.multi(td.callback as any))
      .thenCallback(null, ['OK']);

    td.when(redisClient?.set(`indices:${INDEX_ID}`, td.matchers.anything(), td.matchers.anything(), td.callback)).
      thenCallback(null, "OK");

    supertest(server)
      .post(url)
      .send(sendData)
      .expect(200)
      .then((res) => {
        expect(res.status).to.equal(200);
        expect(res.body).to.eq("OK");
        done();
      }, (err) => {
        expect(err).to.be.null;
      })
      .catch((error) => {
        done();
      });
  });


});
