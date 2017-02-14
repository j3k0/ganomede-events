# Ganomede-events REST API

# Events [/events/v1/events]

## Retrieve recent messages [GET]

    + GET parameters
        + secret (string, required) ... Authentication token
        + channel (string, required) ... The channel to listen to
        + after (integer) ... All events received after the one with given ID
        + limit (integer) ... Limit max amount of received events (default to 100)

Will retrieve all recent events for the given channel. In case no new events are available, the request will wait for data until a timeout occurs.

### response [200] OK

    [{
        "id": 12,
        "timestamp": 1429084002258,
        "from": "turngame/v1",
        "type": "MOVE",
        "data": { ... }
    },
    {
        "id": 19,
        "timestamp": 1429084002258,
        "from": "invitations/v1",
        "type": "INVITE",
        "data": { ... }
    }]

### response [401] Unauthorized

If secret is invalid.

## Emit an event [POST]

### body (application/json)

    {
        "channel": "my-events-channel",
        "from": "turngame/v1",
        "secret": "api-secret-passphrase",
        "type": "MOVE",
        "data": { ... }
    }

### response [200] OK

    {
        "id": 12
        "timestamp": 1429084002258
    }

### response [401] Unauthorized

If secret is invalid.

### design note

The value of "secret" should be equal to the `API_SECRET` environment variable.

