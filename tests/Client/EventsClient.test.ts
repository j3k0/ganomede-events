
import { expect } from 'chai';
import td from 'testdouble';
import { Cursor } from '../../src/client/Cursor';
import { EventsClient } from '../../src/client/EventsClient';

describe('EventsClient', () => {
  const createClient = () => new EventsClient({
    protocol: 'http',
    hostname: 'example.com',
    port: 80,
    pathnamePrefix: '/events/v1',
    clientId: 'test',
    secret: 'api_secret'
  });

  it('#getEvents() request events', (done) => {
    const client = createClient();
    const cursor = new Cursor('channel', { limit: 10 });
    const validPath = td.matchers.contains({
      path: '/events/v1/events?channel=channel&limit=10&clientId=test&secret=api_secret'
    });

    td.replace((client as any).api, 'get', td.function());
    //console.log((client as any).api.get.toString());

    td.when((client as any).api.get(validPath, td.matchers.anything()))
      .thenDo((path, cb: (e: Error | null, req, res, obj: any) => void) => {
        cb(null, null, null, { ok: true });
      });
    //.thenCallback(null, { ok: true });

    client.getEvents(cursor, (err, events) => {
      expect(err).to.be.null;
      expect(events).to.eql({ ok: true });
      done();
    });
  });

  describe('#post()', () => {
    const channel = 'some-channel-with-events';
    const from = 'service/v1';
    const type = 'event-type';
    const data = { something: true };
    const reply = { id: 1, timestamp: Date.now() };

    it('sends events', (done) => {
      const client = createClient();
      const expectedPath = td.matchers.contains({ path: '/events/v1/events' });
      const expectedBody = {
        secret: 'api_secret',
        clientId: 'test',
        channel,
        from: 'service/v1',
        type: 'event-type',
        data: { something: true }
      };

      td.replace((client as any).api, 'post', td.function());

      td.when((client as any).api.post(expectedPath, expectedBody, td.matchers.anything()))
        .thenDo((path, body, cb: (e: Error | null, req, res, obj: any) => void) => {
          cb(null, null, null, reply);
        });
      // .thenCallback(null, reply);

      client.sendEvent(channel, { from, type, data }, (err, header) => {
        expect(err).to.be.null;
        expect(header).to.eql(reply);
        done();
      });
    });

    it('translates `event.req_id` to X- header', (done) => {
      const client = createClient();
      const event = { from, type, req_id: 'deadbeef' };

      const expectedOptions = {
        path: '/events/v1/events',
        headers: { 'x-request-id': 'deadbeef' }
      };

      td.replace((client as any).api, 'post', td.function());

      td.when((client as any).api.post(expectedOptions, td.matchers.isA(Object), td.matchers.anything()))
        .thenDo((path, body, cb: (e: Error | null, req, res, obj: any) => void) => {
          cb(null, null, null, reply);
        });
      // .thenCallback(null, reply);

      client.sendEvent(channel, event, (err, header) => {
        expect(err).to.be.null;
        expect(header).to.eql(reply);
        done();
      });
    });
  });
});
