'use strict';

const util = require('util');
const lodash = require('lodash');

class Cursor {
  constructor (channel, {after = null, limit = null} = {}) {
    if (typeof channel !== 'string' || (channel.length === 0)) {
      const message = util.format(
        'new Cursor() requires channel to be non-empty string, got %j (%s)',
        channel,
        typeof channel
      );

      throw new Error(message);
    }

    this.channel = channel;
    this.after = after;
    this.limit = limit;
  }

  advance (events) {
    const newestEvent = Array.isArray(events) && (events.length > 0)
      ? lodash.maxBy(events, event => event.id)
      : undefined;

    return newestEvent
      ? new Cursor(this.channel, {limit: this.limit, after: newestEvent.id})
      : this;
  }

  toQuery () {
    const qs = {channel: this.channel};

    if (this.after !== null)
      qs.after = this.after;

    if (this.limit !== null)
      qs.limit = this.limit;

    return qs;
  }
}

module.exports = Cursor;
