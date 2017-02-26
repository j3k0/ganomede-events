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
      clientID: 'me'
    };

    const expectedOptions = td.matchers.argThat(arg => {
      expect(lodash.pick(arg, 'uri', 'method', 'agent', 'qs')).to.eql({
        uri: 'http://example.com/events',
        method: 'get',
        agent: baseOpts.agent,
        qs: {
          secret: 'qwerty',
          clientID: 'me',
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

  it('#post() sends events', (done) => {
    const type = 'event-type';
    const data = {something: true};
    const header = {id: 1, timestamp: Date.now()};
    const baseOpts = {
      apiRoot: 'http://example.com/events',
      secret: 'qwerty',
      agent: http.globalAgent,
      clientID: 'me'
    };

    const expectedOptions = td.matchers.argThat(arg => {
      expect(lodash.pick(arg, 'uri', 'method', 'agent', 'body')).to.eql({
        uri: 'http://example.com/events',
        method: 'post',
        agent: baseOpts.agent,
        body: {
          secret: 'qwerty',
          clientID: 'me',
          channel: 'me:event-type',
          from: 'me',
          type: 'event-type',
          data: {something: true}
        }
      });
      return true;
    });

    td.when(request(expectedOptions, td.matchers.isA(Function)))
      .thenDo((options, cb) => setImmediate(cb, null, {statusCode: 200}, header));

    const obj = requestEvents(baseOpts);
    obj.post(type, data, (err, header) => {
      expect(err).to.be.null;
      expect(header).to.eql(header);
      done();
    });
  });
});
