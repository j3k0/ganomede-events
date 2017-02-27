# ganomede-events

> NodeJS events stream library

A server and a library allowing services to register and process system events. Relies on redis.

## Table of Contents

- [Background](#background)
- [Install](#install)
- [Usage](#usage)
- [API](#api)
- [Contribute](#contribute)
- [License](#license)

## Background

This was created part of ganomede, a collection of game-related micro services using NodeJS.

## Install

```
npm install ganomede-events
```

## Usage

### Server

Assuming a redis server runs on localhost:6379, you can start a ganomede-events server this way:

```sh
ganomede-events-server
```

For specific setup, you can configure using environment variables:

 - `export API_SECRET="my-api-secret-token"`
 - `export REDIS_EVENTS_PORT_6379_TCP_ADDR="192.168.1.4"`
 - `export REDIS_EVENTS_PORT_6379_TCP_PORT="34009"`
 - `export POLL_TIMEOUT="30000"`

You can also start a server from the public docker image:

```sh
docker run -p 8000:8000 --link redis_events:redis_events ganomede/events
```

You can also play around with provided `docker-compose.yml` and `Dockerfile`.

### Client Library

`Client` is an [`EventEmitter`](https://nodejs.org/docs/latest/api/events.html#events_class_eventemitter). When you [register handler for an event](https://nodejs.org/docs/latest/api/events.html#events_emitter_on_eventname_listener), it will treat `eventName` as channel you'd like to listen for events on (and start issuing HTTP(S) request). When you remove all listeners for a channel, future HTTP(S) request will stop (but request currently running won't be aborted!).

```js
const {Client} = require('ganomede-events');
const clientId = 'mailchimp-synchronizer';
const events = new Client(clientId, options); // see Client API for more

// Send @event to a specific @channel with
//   Client#send(channel, event[, callback])
events.send('users/v1:add', {
  from: 'users/v1',
  type: 'add',
  data: {
    thing: 'abc',
    stuff: 123,
    blob: [12, 13, 14]
  }
});

// Our event handler
const handler = (event) => {
  console.dir(event);
  //
    console.log("id: " + event.id);
    console.log("from: " + event.from + " == users/v1");
    console.log("type: " + event.type + " == add");
    console.log("timestamp: " + event.timestamp);
    console.log("data: " + JSON.stringify(event.data));
    // Contains the custom data sent with "send"
    //     event.data.thing
    //     event.data.stuff
    //     event.data.blob
};


events.on('users/v1', handler);     // listen to all events from a channel
events.on('users/v1:add', handler); // or specific type
events.removeListener('users/v1:add', handler); // remove specific handlers

// `error` event is special (like some others, see below for more),
// it won't poll `error` channel and you can't send events to that channel.
// (it will also throw if no handlers are registred)
events.on('error', (channel, error) => { /* handle HTTP(S) error */ });
```

## API

The [server REST API is documented here](API.md). Find below the API for the NodeJS library.

### `new Client(clientId, options)`

Creates the pub/sub client.

**Arguments**

 * `clientId: string`
    * requried
    * a unique identifier for the client
    * used on the server to save/restore state

 * `options: object` with the following fields:
    * `secret: string`
      * `API_SECRET` of remote
      * **requried** and must be non-empty
    * `agent` — [`http.Agent`](https://nodejs.org/docs/latest/api/http.html#http_class_http_agent) or [`https.Agent`](https://nodejs.org/docs/latest/api/https.html#https_class_https_agent) instance
      * agent to use (useful for enabling things like `keepAlive`, number of simultaneous requests, etc.)
      * **defaults** to [`http.globalAgent`](https://nodejs.org/docs/latest/api/http.html#http_http_globalagent) or [`https.globalAgent`](https://nodejs.org/docs/latest/api/https.html#https_https_globalagent) (depending on protocol)
    * `protocol: string`
      * protocol used to connect to the notifications service (`'http'` or `'https'`)
      * **default** `'http'`
    * `hostname: string`
      * hostname or ip of the notifications service
      * **default** `'localhost'`
    * `port: int`
      * port number of the notifications service
      * **default** `8000`
    * `pathname: string`
      * endpoint's pathname
      * **default** `config.http.prefix + '/events'` (`'/events/v1/events'`)

### `Client#send(channel, event[, callback])`

Publish an event to a given channel.

**Arguments**

 * `channel: string` requred — the channel to publish to
 * `event: object` requred — must contain 2 string props: `from` and `type` specifying sender and type of an event. You can also add `data` prop containing any truthy object with custom data you'd like to attach to the event.
 * `callback: Function` — will receive two arguments: `(error, header)`, header will containt Event ID and Timestamp (assigned by server). IDs are specific to the channel, so it is possible to have 2 events with ID `1` in different channels.

### `Client#on(channel, handler)`

Start receiving events from a given channel.

**Arguments**

  - `channel: string` required;
  - `handler: Function` required; will receive new events, signature is `(event, channel)`. The shape of event is the same as in `#send()`.

Some `channel`s are special, and you can not listen or send messages to those:

  - [`newListener`](https://nodejs.org/docs/latest/api/events.html#events_event_newlistener) / [`removeListener`](https://nodejs.org/docs/latest/api/events.html#events_event_removelistener) — `EventEmitter`'s events;
  - `error` — used to handle HTTP(S) errors, handler invoked with `(error, channel)`. Non-200 statuses are errors.
  - `drain` — when there are no channel-listeners and all HTTP(S) request are finished.

### `Client#removeListener(eventName, handler)`

Same as [`EventEmitter#removeListener()`](https://nodejs.org/dist/latest-v7.x/docs/api/events.html#events_emitter_removelistener_eventname_listener).

If there are no listeners left for a particular channel, no new HTTP(S) request will be issued. **Note** that any requests in-progress will finish, and events will be discarded.

**Arguments**

 * `channel: string`
 * `handler: Function`

## Contribute

PRs accepted.

Small note: If editing the README, please conform to the [standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## License

MIT © Jean-Christophe Hoelt <hoelt@fovea.cc>
