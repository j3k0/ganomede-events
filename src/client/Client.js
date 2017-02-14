'use strict';

const url = require('url');
const {EventEmitter} = require('events');
const lodash = require('lodash');
const requestEvents = require('./request-events');
const config = require('../../config');

// Some events are special, and have nothing to do with our channles,
// we should not start HTTP request for them. should not monitor them:
//
const ignoreChannels = [
  'newListener',    // EventEmitter's after listener added
  'removeListener', // EventEmitter's after listener removed
  'error',          // HTTP request errored
  'drain'           // All the requests are finished and there are no listeners left.
];

class Client extends EventEmitter {
  constructor (id, {
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

    super();
    this.id = id;
    this.polls = {}; // channel => Boolean ()
    this.agent = agent || require(normalizedProtocol.slice(0, -1)).globalAgent;
    this.apiRoot = url.format({
      protocol: normalizedProtocol,
      hostname,
      port,
      pathname
    });
  }

  emitEvent (event) {
    const service = event.from;
    const eventType = event.type;
    this.emit(service, event);
    this.emit(`${service}:${eventType}`, event);
  }

  request (channel, callback) {
    const options = {
      uri: this.apiRoot,
      method: 'get',
      agent: this.agent,
      json: true,
      gzip: true,
      qs: {
        secret: this.secret,
        clientID: this.id,
        channel
      }
    };

    requestEvents(options, callback);
  }

  checkForDrain () {
    if (lodash.values(this.polls).every(status => !status))
      this.emit('drain');
  }

  startPolling (channel) {
    if (this.polls[channel])
      return;

    this.polls[channel] = true;

    this.request(channel, (err, events) => {
      if (err)
        this.emit('error', channel, err);
      else
        events.forEach(e => this.emitEvent(e));

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
}

module.exports = Client;
