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

You can also start a server from the public docker image:

```sh
docker run -p 8000:8000 --link redis_events:redis_events ganomede/events
```

### Library

```js
const GanomedeEvents = require('ganomede-events');

const events = GanomedeEvents.createClient({
    id: "mailchimp-synchronizer",
    secret: 'my-api-secret-token',
    host: "events.local",
    port: 8000
});

// Emit an event, with custom data
events.send('users/v1:add', {
    thing: 'abc',
    stuff: 123,
    blob: [ 12, 13, 14 ]
});

// Our event handler
const handler = (event) => {
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

// Start listening to events
events.on('users/v1:add', handler);

// Stop listening to events
events.off('users/v1:add', handler);

// Listen to any event from 'users/v1'
events.on('users/v1:add', handler);

// Listen to any event
events.on('*', handler);
```

## API

The [server REST API is documented here](API.md). Find below the API for the NodeJS library.

### GanomedeEvents.createClient(options)

Creates the pub/sub client.

**Arguments**

 * `options: object` with the following fields:
    * `id: string`
      * a unique identifier for the client
      * **optional**
      * used internally to save/restore state;
      * when not specified, some events might be received again after a restart;
    * `host: string`
      * hostname or ip of the notifications service
      * **default** `"localhost"`
    * `port: int`
      * port number of the notifications service
      * **default** `8000`
    * `protocol: string`
      * protocol used to connect to the notifications service (http or https)
      * **default** `"http"`

### client.send(channel, data)

Publish an event to a given channel.

**Arguments**

 * `channel: string`
   * the channel to publish to
 * `data: object`
   * custom user-specified data

### client.on(channel, handler)

Start receiving events from a given channel.

**Arguments**

 * `channel: string`
   * the channel to listen to
   * `"*"` for all channels
 * `handler: function(event)`
   * handle messages posted on the given channel.
   * receives as argument an event object, with the following fields:
     * `id: int`
       * strictly incrementing unique ID for this event
     * `channel: string`
       * the channel the event was posted to
     * `timestamp: int`
       * milliseconds elapsed between Epoch and posting of the event
     * `data: object`
       * custom user-specified data

### client.off(channel, handler)

Stop receiving events from a given channel.

**Arguments**

 * `channel: string`
   * the channel to stop listening to
   * `"*"` for all channels
 * `handler: function(event)`
   * the handler to unsusbribe

## Contribute

PRs accepted.

Small note: If editing the README, please conform to the [standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## License

MIT © Jean-Christophe Hoelt <hoelt@fovea.cc>
