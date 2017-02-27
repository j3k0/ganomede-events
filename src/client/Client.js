'use strict';

const {EventEmitter} = require('events');
const lodash = require('lodash');
const Cursor = require('./Cursor');
const requestEvents = require('./request');
const config = require('../../config');

// Some events are special, and have nothing to do with our channles,
// we should not start HTTP request for them. should not monitor them:
const ignoreChannels = [
  'newListener',    // EventEmitter's after listener added
  'removeListener', // EventEmitter's after listener removed
  'error',          // HTTP request errored
  'drain'           // All the requests are finished and there are no listeners left.
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

    const normalizedProtocol = protocol.endsWith(':') ? protocol : `${protocol}:`;
    const agentArg = agent || require(normalizedProtocol.slice(0, -1)).globalAgent;
    const apiRoot = {
      protocol: normalizedProtocol,
      hostname,
      port,
      pathname
    };

    super();
    this.request = requestEvents({apiRoot, secret, agent: agentArg, clientId});
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

    this.request.get(cursor, (err, events) => {
      if (err)
        this.emit('error', channel, err);
      else
        events.forEach(e => this.emit(channel, e));

      this.cursors[channel] = cursor.advance(events);
      this.polls[channel] = false;

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

  send (type, data, callback) {
    const args = (arguments.length === 2)
      ? [type, null, data]
      : [type, data, callback];

    this.request.post(...args);
  }
}

module.exports = Client;
