// unit tests for events.middleware.post

'use strict';

const td = require('testdouble');
const restify = require('restify');
const {parsePostParams} = require('../src/parse-http-params');

const {anything, isA} = td.matchers;
const {verify, when} = td;
const calledOnce = {times: 1, ignoreExtraArgs: true};

describe('events.middleware.post', () => {

  let poll;
  let store;
  let middleware;
  let log;
  let req;
  let res;
  let next;

  const FAILING_ADD_CHANNEL = 'failing-add-channel';
  const FAILING_EMIT_CHANNEL = 'failing-emit-channel';
  const SUCCESS_CHANNEL = 'success-channel';
  const SUCCESS_EVENT = {
    from: 'from',
    type: 'type',
    data: {a: 1, b: 2}
  };
  const SUCCESS_ID = 3;
  const SUCCESS_EVENT_WITH_ID = Object.assign(
    {id: SUCCESS_ID}, SUCCESS_EVENT);

  const testChannels = {};

  // FAILING_ADD_CHANNEL:
  //  - addEvent fails with a InternalServerError
  testChannels[FAILING_ADD_CHANNEL] = () => {
    when(store.addEvent(FAILING_ADD_CHANNEL, anything()))
      .thenCallback(new restify.InternalServerError());
  };

  // SUCCESS_CHANNEL:
  //  - addEvent and emit succeeds
  testChannels[SUCCESS_CHANNEL] = () => {
    when(store.addEvent(SUCCESS_CHANNEL, SUCCESS_EVENT))
      .thenCallback(null, SUCCESS_EVENT_WITH_ID);
    td.when(poll.emit(SUCCESS_CHANNEL, anything()))
      .thenCallback(null);
  };

  // FAILING_EMIT_CHANNEL:
  //  - addEvent succeeds
  //  - emit fails with a InternalServerError
  testChannels[FAILING_EMIT_CHANNEL] = () => {
    when(store.addEvent(FAILING_EMIT_CHANNEL, SUCCESS_EVENT))
      .thenCallback(null, SUCCESS_EVENT_WITH_ID);
    td.when(poll.emit(FAILING_EMIT_CHANNEL, anything()))
      .thenCallback(new restify.InternalServerError());
  };

  beforeEach(() => {

    store = td.object(['addEvent']);
    when(store.addEvent(anything(), anything()))
      .thenCallback(new Error('unexpected store.addEvent'));

    poll = td.object(require('../src/poll.js').createPoll({}));
    when(poll.emit(anything(), anything()))
      .thenCallback(new Error('unexpected poll.emit'));

    log = td.object(['error', 'info']);

    middleware = require('../src/events.middleware.post')
      .createMiddleware({poll, store, log});

    const input = validInput();
    req = input.req;
    res = input.res;
    next = input.next;
  });

  const validRequest = () => ({
    body: Object.assign({
      clientId: 'test-client'
    }, SUCCESS_EVENT)
  });

  const validInput = () => ({
    req: validRequest(),
    res: td.object(['json']),
    next: td.function('next')
  });

  const withChannel = (channel) => {
    if (testChannels[channel])
      testChannels[channel]();
    req.body.channel = channel;
    middleware(req, res, next);
  };

  it('fails when channel parameter is undefined', () => {
    withChannel(undefined);
    verify(next(), calledOnce);
    verify(next(isA(restify.InvalidContentError)));
  });

  it('fails when store.addEvent fails', () => {
    withChannel(FAILING_ADD_CHANNEL);
    verify(next(), calledOnce);
    verify(next(isA(restify.InternalServerError)));
  });

  it('logs poll.emit failures to the console', () => {
    withChannel(FAILING_EMIT_CHANNEL);
    verify(next(), calledOnce);
    verify(log.error(), {ignoreExtraArgs: true});
  });

  it('responds with the added event', () => {
    withChannel(SUCCESS_CHANNEL);
    verify(next(), calledOnce);
    verify(next());
    verify(res.json(SUCCESS_EVENT_WITH_ID));
    verify(log.error(), {times: 0, ignoreExtraArgs: true});
  });

  describe('parsePostParams()', () => {
    const from = 'service/v1';
    const type = 'new-something';
    const data = {thing: true};
    const clientId = 'test-client';
    const channel = 'channel';

    it('parses valid stuff', () => {
      expect(parsePostParams({from, type, data, clientId, channel})).to.eql({
        clientId,
        channel,
        event: {from, type, data},
      });

      expect(parsePostParams({from, type, clientId, channel})).to.eql({
        clientId,
        channel,
        event: {from, type}
      });
    });

    it('from must be non-empty string', () => {
      const t = (input) => {
        const actual = parsePostParams(input);
        expect(actual).to.be.instanceof(Error);
        expect(actual.message).to.equal('Invalid from');
      };

      t({channel, clientId});
      t({from: '', channel, clientId});
      t({from: undefined, channel, clientId});
      t({from: [], channel, clientId});
      t({from: 42, channel, clientId});
    });

    it('type must be non-empty string', () => {
      const t = (input) => {
        const actual = parsePostParams(input);
        expect(actual).to.be.instanceof(Error);
        expect(actual.message).to.equal('Invalid type');
      };

      t({from, channel, clientId});
      t({type: '', from, channel, clientId});
      t({type: undefined, from, channel, clientId});
      t({type: [], from, channel, clientId});
      t({type: 42, from, channel, clientId});
    });

    it('data must be non-null object or not present', () => {
      const t = (input) => {
        const actual = parsePostParams(input);
        expect(actual).to.be.instanceof(Error);
        expect(actual.message).to.equal('Invalid data');
      };

      t({data: '', type, from, channel, clientId});
      t({data: undefined, type, from, channel, clientId});
      t({data: 42, type, from, channel, clientId});
      t({data: null, type, from, channel, clientId});
    });

    it('client id must be non-empty string', () => {
      const t = (input) => {
        const actual = parsePostParams(input);
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
        const actual = parsePostParams(input);
        expect(actual).to.be.instanceof(Error);
        expect(actual.message).to.equal('Invalid Channel');
      };

      t({clientId});
      t({channel: '', clientId});
      t({channel: 42, clientId});
      t({channel: false, clientId});
      t({channel: undefined, clientId});
    });
  });

});
// vim: ts=2 sw=2 et

