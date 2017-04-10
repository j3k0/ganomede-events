'use strict';

const {EventEmitter} = require('events');
const lodash = require('lodash');
const Cursor = require('./Cursor');
const EventsClient = require('./EventsClient');
const config = require('../../config');

const noop = () => {};

// Some events are special, and have nothing to do with our channles,
// we should not start HTTP request for them. should not monitor them:
const ignoreChannels = [
  'newListener',    // EventEmitter's after listener added
  'removeListener', // EventEmitter's after listener removed
  'error',          // HTTP request errored
  'drain',          // All the requests are finished and there are no listeners left.
  'cycle'           // ({finished, next}, channel) After completing every HTTP request for that channel.
];

class Client extends EventEmitter {
  constructor (clientId, {
    secret,
    agent,
    protocol = 'http',
    hostname = 'localhost',
    port = 8000,
    pathname = `${config.http.prefix}/events`
  } = {}) {
    if ((typeof secret !== 'string') || (secret.length === 0))
      throw new Error('options.secret must be non-empty string');

    super();

    const normalizedProtocol = protocol.endsWith(':') ? protocol : `${protocol}:`;
    const agentArg = agent || require(normalizedProtocol.slice(0, -1)).globalAgent;

    this.client = new EventsClient({
      agent: agentArg,
      protocol,
      hostname,
      port,
      pathnamePrefix: pathname,
      clientId,
      secret
    });

    this.polls = {};   // which cursor is running (channel -> bool)
    this.cursors = {}; // channel -> cursor
  }

  checkForDrain () {
    if (lodash.values(this.polls).every(status => !status))
      this.emit('drain');
  }

  startPolling (channel) {
    if (this.polls[channel])
      return;

    this.polls[channel] = true;
    const cursor = this.cursors[channel] = this.cursors[channel] || new Cursor(channel);

    this.client.getEvents(cursor, (err, events) => {
      if (err)
        this.emit('error', err, channel);
      else
        events.forEach(event => this.emit(channel, event, channel));

      this.cursors[channel] = cursor.advance(events);
      this.polls[channel] = false;

      this.emit('cycle', {
        finished: cursor,
        next: this.cursors[channel]
      }, channel);

      // If there are still listeners for this channel, keep polling.
      // Otherewise we might be in a situation when all the requests
      // are finished, appropriated events are emitted, and no one listening.
      if (this.listenerCount(channel) === 0)
        return this.checkForDrain();

      process.nextTick(() => this.startPolling(channel));
    });
  }

  on (channel, handler) {
    // TODO
    // perhaps print warnings of some kind
    if (!ignoreChannels.includes(channel))
      this.startPolling(channel);

    super.on(channel, handler);
  }

  send (channel, eventArg, callback = noop) {
    const {from, type, data} = eventArg;
    const hasData = eventArg.hasOwnProperty('data');

    if (ignoreChannels.includes(channel))
      return setImmediate(callback, new TypeError(`channel can not be any of ${ignoreChannels.join(', ')}`));

    if ((typeof from !== 'string') || (from.length === 0))
      return setImmediate(callback, new TypeError('from must be non-empty string'));

    if ((typeof type !== 'string') || (type.length === 0))
      return setImmediate(callback, new TypeError('type must be non-empty string'));

    if (hasData && (!data || (typeof data !== 'object')))
      return setImmediate(callback, new TypeError('data must be non-falsy object'));

    const event = hasData
      ? {from, type, data}
      : {from, type};

    this.client.sendEvent(channel, event, callback);
  }
}

module.exports = Client;
