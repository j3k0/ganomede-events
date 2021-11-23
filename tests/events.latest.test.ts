// unit tests for events.middleware.get

import { expect } from 'chai';
import supertest from 'supertest';
import { createServer } from '../src/server';
import { config } from '../config';
import { latest } from '../src/latest.router';
import { parseLatestGetParams } from '../src/parse-http-params';
import { RedisClient } from 'redis';
import td from 'testdouble';
import { EventsStore } from '../src/events.store';
import { AsyncResultCallback } from 'async';
import { Server } from 'restify';

const { anything } = td.matchers;
const { when } = td;
const url = `${config.http.prefix}/latest`;
const NON_EMPTY_CHANNEL = 'non-empty-channel';

const SUCCESS_CHANNEL = 'success-channel';
const SUCCESS_EVENT1 = {
  from: 'from1',
  type: 'type2',
  data: { m: 4, x: 4 }
};
const SUCCESS_EVENT2 = {
  from: 'from2',
  type: 'type3',
  data: { m: 1, x: 9 }
};

let redisClient: RedisClient | null;

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

  let server: Server | null = null;
  let store: EventsStore | null;

  beforeEach(done => {

    redisClient = td.object(['zrange', 'mget']) as RedisClient;
    store = td.object(['addEvent', 'loadLatestItems']) as EventsStore;

    when(store.addEvent(anything(), anything(), td.callback))
      .thenCallback(new Error('unexpected store.addEvent'));
    // when(store.loadLatestItems(anything(), anything(), td.callback))
    //   .thenCallback(new Error('unexpected store.loadLatestItems'));

    server = createServer();
    latest(config.http.prefix, server, redisClient, store);
    server.listen(done);
  });

  afterEach(done => {
    // redisClient.quit();
    server!.close(done);
    store = redisClient = null;
  });



  it(`expects to return the latest 1 event out of 2 events `, (done) => {

    let eventsArray: { [type: string]: any[] } = {};
    let i = 1;

    // add some logic to storeEvents.addEvent so we can add events later
    when(store?.addEvent(SUCCESS_CHANNEL, anything(), td.callback))
      .thenDo((channel: string, event: any, cb: AsyncResultCallback<any, Error>) => {
        let eventWithId: {} = Object.assign(
          { id: i }, event);
        if (!eventsArray[channel]) eventsArray[channel] = [];

        eventsArray[channel].push(eventWithId);
        i++;
        cb(null, eventWithId);
      });

    // add events1 and 2
    store?.addEvent(SUCCESS_CHANNEL, SUCCESS_EVENT1, () => { });
    store?.addEvent(SUCCESS_CHANNEL, SUCCESS_EVENT2, () => { });

    //add the logic to load the latest N elements
    td.when(store?.loadLatestItems(SUCCESS_CHANNEL, 1, anything()))
      .thenDo((channel: string, limit: number, cb2: (e: Error | null | undefined, res?: any) => void) => {
        cb2(null, eventsArray[channel].slice(-limit));
      });

    // go for the test now using the api.
    supertest(server)
      .get(url)
      .query({ channel: SUCCESS_CHANNEL, limit: 1, secret: process.env.API_SECRET })
      .end((err, res) => {
        expect(res.body).to.eql([{id:2,from:"from2",type:"type3",data:{m:1,x:9}}]);
        expect(err).to.be.null;
        expect(res.status).to.equal(200);
        done();
      });
  });


  it(`returns the list of events for non-empty channel`, (done) => {

    // td.when(redisClient?.zrange(`${NON_EMPTY_CHANNEL}:keys`, -1, -1, td.callback))
    //   .thenCallback(null, ['my-event-id']);

    td.when(store?.loadLatestItems(NON_EMPTY_CHANNEL, 1, td.callback))
      .thenCallback(null, [{ stuff: "things" }]);

    // td.when(redisClient?.mget(['my-event-id'], td.callback))
    //   .thenCallback(null, ['{"stuff":"things"}']);

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




});
