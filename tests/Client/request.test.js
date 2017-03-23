'use strict';

const http = require('http');
const lodash = require('lodash');
const Cursor = require('../../src/client/Cursor');

describe('.request()', () => {
  let request;
  let requestEvents;

  beforeEach(() => {
    request = td.replace('request', td.function());
    requestEvents = require('../../src/client/request');
  });

  it('#get() request events', (done) => {
    const cursor = new Cursor('channel', {limit: 10});
    const baseOpts = {
      apiRoot: 'http://example.com/events',
      secret: 'qwerty',
      agent: http.globalAgent,
      clientId: 'me'
    };

    const expectedOptions = td.matchers.argThat(arg => {
      expect(lodash.pick(arg, 'uri', 'method', 'agent', 'qs')).to.eql({
        uri: 'http://example.com/events',
        method: 'get',
        agent: baseOpts.agent,
        qs: {
          secret: 'qwerty',
          clientId: 'me',
          channel: 'channel',
          limit: 10
        }
      });
      return true;
    });

    td.when(request(expectedOptions, td.matchers.isA(Function)))
      .thenDo((options, cb) => setImmediate(cb, null, {statusCode: 200}, []));

    const obj = requestEvents(baseOpts);
    obj.get(cursor, done);
  });

  describe('#post()', () => {
    const clientId = 'not-the-same-as-from-necessarily';
    const channel = 'some-channel-with-events';
    const from = 'service/v1';
    const type = 'event-type';
    const data = {something: true};
    const reply = {id: 1, timestamp: Date.now()};
    const baseOpts = {
      apiRoot: 'http://example.com/events',
      secret: 'qwerty',
      agent: http.globalAgent,
      clientId
    };

    it('sends events', (done) => {
      const subject = requestEvents(baseOpts);

      const expectedOptions = td.matchers.argThat(arg => {
        expect(lodash.pick(arg, 'uri', 'method', 'agent', 'body', 'headers')).to.eql({
          uri: 'http://example.com/events',
          method: 'post',
          agent: baseOpts.agent,
          headers: {},
          body: {
            secret: 'qwerty',
            clientId: 'not-the-same-as-from-necessarily',
            channel: 'some-channel-with-events',
            from: 'service/v1',
            type: 'event-type',
            data: {something: true}
          }
        });
        return true;
      });

      td.when(request(expectedOptions, td.matchers.isA(Function)))
        .thenDo((options, cb) => setImmediate(cb, null, {statusCode: 200}, reply));

      subject.post(channel, {from, type, data}, (err, header) => {
        expect(err).to.be.null;
        expect(header).to.eql(reply);
        done();
      });
    });

    it('translates `event.req_id` to X- header', (done) => {
      const subject = requestEvents(baseOpts);
      const event = {from, type, req_id: 'deadbeef'};

      const expectedOptions = td.matchers.contains({
        headers: {
          'x-request-id': 'deadbeef'
        }
      });

      td.when(request(expectedOptions, td.matchers.isA(Function)))
        .thenDo((options, cb) => setImmediate(cb, null, {statusCode: 200}, reply));

      subject.post(channel, event, (err, header) => {
        expect(err).to.be.null;
        expect(header).to.eql(reply);
        done();
      });
    });
  });
});
