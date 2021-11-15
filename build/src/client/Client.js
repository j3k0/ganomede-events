'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const { EventEmitter } = require('events');
const lodash_1 = __importDefault(require("lodash"));
const Cursor = require('./Cursor');
const EventsClient = require('./EventsClient');
const config_1 = require("../../config");
const setImmediate_1 = __importDefault(require("async/setImmediate"));
const noop = () => { };
// Some events are special, and have nothing to do with our channles,
// we should not start HTTP request for them. should not monitor them:
const ignoreChannels = [
    'newListener',
    'removeListener',
    'error',
    'drain',
    'cycle' // ({finished, next}, channel) After completing every HTTP request for that channel.
];
class Client extends EventEmitter {
    constructor(clientId, { secret = '', // [required]
    agent = '', // [optional] http/https agent to use https://nodejs.org/api/http.html#http_class_http_agent
    protocol = 'http', hostname = 'localhost', port = 8000, pathname = `${config_1.config.http.prefix}` } = {}) {
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
        this.polls = {}; // which cursor is running (channel -> bool)
        this.cursors = {}; // channel -> cursor
    }
    checkForDrain() {
        if (lodash_1.default.values(this.polls).every(status => !status))
            this.emit('drain');
    }
    startPolling(channel) {
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
    on(channel, handler) {
        // TODO
        // perhaps print warnings of some kind
        if (!ignoreChannels.includes(channel))
            this.startPolling(channel);
        super.on(channel, handler);
    }
    send(channel, eventArg, callback = noop) {
        const { from, type, data } = eventArg;
        const hasData = eventArg.hasOwnProperty('data');
        if (ignoreChannels.includes(channel))
            return (0, setImmediate_1.default)(callback, new TypeError(`channel can not be any of ${ignoreChannels.join(', ')}`));
        if ((typeof from !== 'string') || (from.length === 0))
            return (0, setImmediate_1.default)(callback, new TypeError('from must be non-empty string'));
        if ((typeof type !== 'string') || (type.length === 0))
            return (0, setImmediate_1.default)(callback, new TypeError('type must be non-empty string'));
        if (hasData && (!data || (typeof data !== 'object')))
            return (0, setImmediate_1.default)(callback, new TypeError('data must be non-falsy object'));
        const event = hasData
            ? { from, type, data }
            : { from, type };
        this.client.sendEvent(channel, event, callback);
    }
}
module.exports = Client;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2xpZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2NsaWVudC9DbGllbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7OztBQUViLE1BQU0sRUFBQyxZQUFZLEVBQUMsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDekMsb0RBQTRCO0FBQzVCLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUNuQyxNQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUMvQyx5Q0FBb0M7QUFDcEMsc0VBQThDO0FBRTlDLE1BQU0sSUFBSSxHQUFHLEdBQUcsRUFBRSxHQUFFLENBQUMsQ0FBQztBQUV0QixxRUFBcUU7QUFDckUsc0VBQXNFO0FBQ3RFLE1BQU0sY0FBYyxHQUFHO0lBQ3JCLGFBQWE7SUFDYixnQkFBZ0I7SUFDaEIsT0FBTztJQUNQLE9BQU87SUFDUCxPQUFPLENBQVcsb0ZBQW9GO0NBQ3ZHLENBQUM7QUFFRixNQUFNLE1BQU8sU0FBUSxZQUFZO0lBQy9CLFlBQWEsUUFBUSxFQUFFLEVBQ3JCLE1BQU0sR0FBRyxFQUFFLEVBQUUsYUFBYTtJQUMxQixLQUFLLEdBQUcsRUFBRSxFQUFHLDRGQUE0RjtJQUN6RyxRQUFRLEdBQUcsTUFBTSxFQUNqQixRQUFRLEdBQUcsV0FBVyxFQUN0QixJQUFJLEdBQUcsSUFBSSxFQUNYLFFBQVEsR0FBRyxHQUFHLGVBQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQ25DLEdBQUcsRUFBRTtRQUNKLElBQUksQ0FBQyxPQUFPLE1BQU0sS0FBSyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDO1lBQ3ZELE1BQU0sSUFBSSxLQUFLLENBQUMseUNBQXlDLENBQUMsQ0FBQztRQUU3RCxLQUFLLEVBQUUsQ0FBQztRQUVSLE1BQU0sa0JBQWtCLEdBQUcsUUFB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