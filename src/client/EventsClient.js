'use strict';

const BaseClient = require('ganomede-base-client');

class EventsClient extends BaseClient {
  constructor ({protocol, hostname, port, pathnamePrefix, clientId, secret, agent}) {
    super(`${protocol}://${hostname}:${port}${pathnamePrefix}`, {agent});
    this.clientId = clientId;
    this.secret = secret;
  }

  getEvents (cursor, callback) {
    const qs = Object.assign(cursor.toQuery(), {
      clientId: this.clientId,
      secret: this.secret
    });

    this.apiCall({method: 'get', path: '/events', qs}, callback);
  }

  sendEvent (channel, event, callback) {
    const body = Object.assign({
      clientId: this.clientId,
      secret: this.secret,
      channel
    }, event);

    this.apiCall({method: 'post', path: '/events', body}, callback);
  }
}

module.exports = EventsClient;
