
import { EventEmitter } from 'events';
import lodash from 'lodash';
import { Cursor } from './Cursor';
import { EventsClient } from './EventsClient';
import { config } from '../../config';
import { setImmediate } from 'async';

const noop = () => undefined;

// Some events are special, and have nothing to do with our channles,
// we should not start HTTP request for them. should not monitor them:
const ignoreChannels = [
  'newListener',    // EventEmitter's after listener added
  'removeListener', // EventEmitter's after listener removed
  'error',          // HTTP request errored
  'drain',          // All the requests are finished and there are no listeners left.
  'cycle'           // ({finished, next}, channel) After completing every HTTP request for that channel.
];

export class Client extends EventEmitter {

  client: EventsClient;
  polls: any;
  cursors: any;

  constructor(clientId: string, {
    secret = '', // [required]
    agent = '',  // [optional] http/https agent to use https://nodejs.org/api/http.html#http_class_http_agent
    protocol = 'http',
    hostname = 'localhost',
    port = 8000,
    pathname = `${config.http.prefix}`
  } = {}) {
    if ((typeof secret !== 'string') || (secret.length === 0))
      throw new Error('options.secret must be non-empty string');

    super();

    const normalizedProtocol = protocol.endsWith(':') ? protocol : `${protocol}:`;
    /* eslint-disable */
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

  checkForDrain(): void {
    if (lodash.values(this.polls).every(status => !status))
      this.emit('drain');
  }

  startPolling(channel: string): void {
    if (this.polls[channel])
      return;

    this.polls[channel] = true;
    const cursor = this.cursors[channel] = this.cursors[channel] || new Cursor(channel);

    this.client.getEvents(cursor, (err: Error, events: []) => {
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

  on(channel: string, handler: (...args: any[]) => void): any {
    // TODO
    // perhaps print warnings of some kind
    if (!ignoreChannels.includes(channel))
      this.startPolling(channel);

    super.on(channel, handler);
    return this;
  }

  send(channel: string, eventArg: { from: string, type: string, data?: any }, callback: ((e: Error, h: any) => void) = noop) {
    const { from, type, data } = eventArg;
    const hasData = Object.prototype.hasOwnProperty.call(eventArg, 'data');// eventArg.hasOwnProperty('data');

    if (ignoreChannels.includes(channel))
      return setImmediate(callback, new TypeError(`channel can not be any of ${ignoreChannels.join(', ')}`));

    if ((typeof from !== 'string') || (from.length === 0))
      return setImmediate(callback, new TypeError('from must be non-empty string'));

    if ((typeof type !== 'string') || (type.length === 0))
      return setImmediate(callback, new TypeError('type must be non-empty string'));

    if (hasData && (!data || (typeof data !== 'object')))
      return setImmediate(callback, new TypeError('data must be non-falsy object'));

    const event = hasData
      ? { from, type, data }
      : { from, type };

    this.client.sendEvent(channel, event, callback);
  }

  getLatestEvents(channel: string, limit = 100, callback: (err: Error, events: []) => void) {
    this.client.getLatestEvents(channel, limit, callback);
  }
}

