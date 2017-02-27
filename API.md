# Ganomede-events REST API

# Events [/events/v1/events]

## Retrieve recent messages [GET]

Query string parameters:

  - `clientId` (`string`, required) — Client ID for remembering last event you requested (see below);
  - `secret` (`string`, required) — authentication token;
  - `channel` (`string`, required) — the channel to receive events from;
  - `after` (`integer`) — only return events whose ID is greater than `after`;
  - `limit` (`integer`) — return at most `limit` events (default to 100).

Will retrieve all recent events for the given channel. In case no new events are available, the request will wait for data until a timeout occurs.

If you do not specify `after`, `clientId` will be used to populate it:

  1. When you explicitly specify `after`:
    - server saves it under `clientId:channel`;
    - so the server knows which message ID this particular client received from that channel before current request.

  1. When `after` is not set:
    - server will pulll it from `clientId:channel`.

This allows to not store last receieved event ID on the client-side, and you can omit `after` for the first request to the `channel` when client process starts.


### response [200] OK

``` json
  [
    { "id": 12,
      "timestamp": 1429084002258,
      "from": "turngame/v1",
      "type": "MOVE",
      "data": [1, 2, 3]
    },

    { "id": 19,
      "timestamp": 1429084002258,
      "from": "invitations/v1",
      "type": "INVITE",
      "data": {"things": 5}
    }
  ]
```

### response [401] Unauthorized

If secret is invalid.

## Emit an event [POST]

### body (application/json)

Body must be a JSON string containing an object which includes the following:

  - `clientId` (`string`, required) — Client ID;
  - `channel` (`string`, required) — the channel to post event to;
  - `secret` (`string`, required) — authentication token;
  - `from` (`string`, required) — identifies `sender`;
  - `type` (`string`, required) — identifies `event`'s type;
  - `data` (`object`, optional) — non-falsy `object` with any custom data you'd like to attach to event.

``` json
  { "clientId": "turngame:worker-01",
    "channel": "turngame-events",
    "secret": "0xDEADBEEF",
    "from": "turngame/v1",
    "type": "MOVE",
    "data": {
      "anything": "you'd like",
      "flag": true
    }
  }
```

### response [200] OK

Response is an "event header" object contatinig server-assigned Event ID (unique per channel) and JS timestamp.

``` json
  { "id": 12,
    "timestamp": 1429084002258 }
```

### response [401] Unauthorized

If secret is invalid.

### design note

The value of "secret" should be equal to the `API_SECRET` environment variable.

