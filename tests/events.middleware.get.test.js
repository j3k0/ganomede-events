// unit tests for events.middleware.get

'use strict';

const td = require('testdouble');
const restify = require('restify');
const {parseGetParams} = require('../src/parse-http-params');

const {anything, isA} = td.matchers;
const {verify, when} = td;
const calledOnce = {times: 1, ignoreExtraArgs: true};

describe('events.middleware.get', () => {
  let poll;
  let store;
  let middleware;
  let log;
  let req;
  let res;
  let next;

  const FAILING_LOAD_CHANNEL = 'failing-load-channel';
  const EMPTY_CHANNEL = 'empty-channel';
  const NON_EMPTY_CHANNEL = 'non-empty-channel';
  const NON_EMPTY_EVENT = {id: 2};
  const TRIGGER_CHANNEL = 'trigger-channel';
  const TRIGGER_EVENT = {id: 1};
  const FAILING_POLL_CHANNEL = 'failing-poll-channel';

  const testChannels = {};

  // NON_EMPTY_CHANNEL:
  //  - has 1 event
  testChannels[NON_EMPTY_CHANNEL] = () => {
    when(store.loadEvents(NON_EMPTY_CHANNEL, anything()))
      .thenCallback(null, [NON_EMPTY_EVENT]);
  };

  // FAILING_LOAD_CHANNEL:
  //  - loading fails with a InternalServerError
  testChannels[FAILING_LOAD_CHANNEL] = () => {
    when(store.loadEvents(FAILING_LOAD_CHANNEL, anything()))
      .thenCallback(new restify.InternalServerError());
  };

  // FAILING_POLL_CHANNEL:
  //  - has no events
  //  - polling will fail
  testChannels[FAILING_POLL_CHANNEL] = () => {
    when(store.loadEvents(FAILING_POLL_CHANNEL, anything()))
      .thenCallback(null, []);
    when(poll.listen(FAILING_POLL_CHANNEL))
      .thenCallback(new Error('poll.listen failed'));
  };

  // EMPTY_CHANNEL:
  //  - has no events
  //  - polling will timeout
  testChannels[EMPTY_CHANNEL] = () => {
    when(store.loadEvents(EMPTY_CHANNEL, anything()))
      .thenCallback(null, []);
    when(poll.listen(EMPTY_CHANNEL))
      .thenCallback(null, null);
  };

  // TRIGGER_CHANNEL:
  //  - has no events initially
  //  - polling will trigger a message,
  //  - then it will have 1 event
  testChannels[TRIGGER_CHANNEL] = () => {

    when(store.loadEvents(TRIGGER_CHANNEL, anything()))
      .thenCallback(null, []);

    when(poll.listen(TRIGGER_CHANNEL, anything()))
      .thenDo((channel, callback) => {
        when(store.loadEvents(TRIGGER_CHANNEL, anything()))
          .thenCallback(null, [TRIGGER_EVENT]);
        callback(null, TRIGGER_EVENT.id);
      });

  };

  beforeEach(() => {

    store = td.object(['loadEvents']);
    when(store.loadEvents(anything(), anything()))
      .thenCallback(new Error('unexpected store.loadEvents'));

    poll = td.object(['listen']);
    when(poll.listen(anything(), anything()))
      .thenCallback(new Error('unexpected poll.listen'));

    log = td.object(['error']);

    middleware = require('../src/events.middleware.get')
      .createMiddleware({poll, store, log});

    const input = validInput();
    req = input.req;
    res = input.res;
    next = input.next;
  });

  const validRequest = () => ({
    params: {
      clientId: 'test-client',
      channel: 'channel',
      after: '0',
      limit: '100'
    }
  });

  const validInput = () => ({
    req: validRequest(),
    res: td.object(['json']),
    next: td.function('next')
  });

  const withChannel = (channel) => {
    if (testChannels[channel])
      testChannels[channel]();
    req.params.channel = channel;
    middleware(req, res, next);
  };

  it('fails when channel parameter is undefined', () => {
    withChannel(undefined);
    verify(next(isA(restify.InvalidContentError)));
    verify(next(), calledOnce);
  });

  it('fails when store.loadEvents fails', () => {
    withChannel(FAILING_LOAD_CHANNEL);
    verify(next(isA(restify.InternalServerError)));
    verify(next(), calledOnce);
  });

  it('returns events right away when already in store', () => {
    withChannel(NON_EMPTY_CHANNEL);
    verify(res.json([NON_EMPTY_EVENT]));
    verify(next(), calledOnce);
  });

  it('polls for events when there are none in store', () => {
    withChannel(EMPTY_CHANNEL);
    verify(poll.listen(), calledOnce);
  });

  it('responds with an empty array when polling timeout', () => {
    withChannel(EMPTY_CHANNEL);
    verify(res.json([]));
    verify(next(), calledOnce);
  });

  it('responds with the event when a new message is polled', () => {
    withChannel(TRIGGER_CHANNEL);
    verify(poll.listen(), calledOnce);
    verify(res.json([TRIGGER_EVENT]));
    verify(next(), calledOnce);
  });

  it('responds with an InternalServerError when polling fails', () => {
    withChannel(FAILING_POLL_CHANNEL);
    verify(poll.listen(), calledOnce);
    verify(next(isA(restify.InternalServerError)));
  });

  it('logs polling errors on the console', () => {
    withChannel(FAILING_POLL_CHANNEL);
    verify(log.error(), calledOnce);
  });

  describe('parseGetParams()', () => {
    const clientId = 'test';
    const channel = 'channel';

    it('parses after to be int within [0, MAX_SAFE_INTEGER]', () => {
      const t = (desiredAfter, expected) => {
        const actual = parseGetParams({clientId, channel, after: desiredAfter});
        expect(actual.after).to.equal(expected);
      };

      // acceptable
      t(0, 0);
      t(50, 50);
      t(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
      // wierd values default to byDefault
      t(undefined, 0);
      t(-1, 0);
      t('wierd', 0);
      t({}, 0);
      t(Number.MAX_SAFE_INTEGER + 1, 0);
    });

    it('parses liimt to be int within [1, 100]', () => {
      const t = (desiredLimit, expected) => {
        const actual = parseGetParams({clientId, channel, limit: desiredLimit});
        expect(actual.limit).to.equal(expected);
      };

      // acceptable
      t(1, 1);
      t(50, 50);
      t(100, 100);
      // wierd values default to byDefault
      t(undefined, 100);
      t(-1, 100);
      t('wierd', 100);
      t({}, 100);
      t(500, 100);
    });

    it('defaults after/limit to 0/100', () => {
      expect(parseGetParams({clientId, channel})).to.eql({
        clientId,
        channel,
        after: 0,
        limit: 100,
        afterExplicitlySet: false
      });
    });

    it('client id must be non-empty string', () => {
      const t = (input) => {
        const actual = parseGetParams(input);
        expect(actual).to.be.instanceof(Error);
        expect(actual.message).to.equal('Invalid Client ID');
      };

      t({channel});
      t({clientId: '', channel});
      t({clientId: 42, channel});
      t({clientId: false, channel});
      t({clientId: undefined, channel});
    });

    it('channel must be non-empty string', () => {
      const t = (input) => {
        const actual = parseGetParams(input);
        expect(actual).to.be.instanceof(Error);
        expect(actual.message).to.equal('Invalid Channel');
      };

      t({clientId});
      t({channel: '', clientId});
      t({channel: 42, clientId});
      t({channel: false, clientId});
      t({channel: undefined, clientId});
    });

    it('afterExplicitlySet is true, when after is found in params', () => {
      expect(parseGetParams({channel, clientId, after: 1})).to.have.property('afterExplicitlySet', true);
      expect(parseGetParams({channel, clientId})).to.have.property('afterExplicitlySet', false);
    });
  });
});
// vim: ts=2 sw=2 et
