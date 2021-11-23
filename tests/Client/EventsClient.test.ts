
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

    td.replace(client.api, 'get', td.function());

    td.when(client.api.get(validPath, td.callback))
      .thenCallback(null, {}, {}, { ok: true });

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

      td.replace(client.api, 'post', td.function());

      td.when(client.api.post(expectedPath, expectedBody, td.callback))
        .thenCallback(null, {}, {}, reply);

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

      td.replace(client.api, 'post', td.function());

      td.when(client.api.post(expectedOptions, td.matchers.isA(Object), td.callback))
        .thenCallback(null, {}, {}, reply);

      client.sendEvent(channel, event, (err, header) => {
        expect(err).to.be.null;
        expect(header).to.eql(reply);
        done();
      });
    });
  });
});
