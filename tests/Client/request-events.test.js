'use strict';

const http = require('http');
const lodash = require('lodash');
const Cursor = require('../../src/client/Cursor');

describe('request-events', () => {
  let request;
  let requestEvents;

  beforeEach(() => {
    request = td.replace('request', td.function());
    requestEvents = require('../../src/client/request-events');
  });

  it('correctly captures things', (done) => {
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

    const fn = requestEvents(baseOpts);
    fn(cursor, done);
  });
});
