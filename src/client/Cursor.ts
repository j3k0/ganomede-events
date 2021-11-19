
import util from 'util';
import lodash from 'lodash';

export class Cursor {
  channel: string = '';
  after: number | null;
  limit: null |undefined;
  constructor (channel?: string, {after = null, limit = null} = {}) {
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

  advance (events: {id: any}[]) {
    const newestEvent = Array.isArray(events) && (events.length > 0)
      ? lodash.maxBy(events, event => event.id)
      : undefined;

    return newestEvent
      ? new Cursor(this.channel, {limit: this.limit, after: newestEvent.id})
      : this;
  }

  toQuery () {
    const qs: {channel: string, after?: number, limit?: string} = {channel: this.channel};

    if (this.after !== null)
      qs['after'] = this.after;

    if (this.limit !== null)
      qs['limit'] = this.limit;

    return qs;
  }
}

