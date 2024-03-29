
import util from 'util';
import lodash from 'lodash';

export type CursorPosition = {
  after?: number | null;
  limit?: number | null;
}

export type CursorParams = CursorPosition & {
  channel: string;
}

export type EventCursor = {
  id: number
}

export class Cursor {
  channel = '';
  after?: number | null;
  limit?: number | null;
  constructor(channel?: string, { after = null, limit = null }: CursorPosition = {}) {
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

  advance(events?: EventCursor[] | null | Error) {
    const newestEvent = Array.isArray(events) && (events.length > 0)
      ? lodash.maxBy(events, event => event.id)
      : undefined;

    return newestEvent
      ? new Cursor(this.channel, { limit: this.limit, after: newestEvent.id })
      : this;
  }

  toQuery(): CursorParams {
    const qs: CursorParams = { channel: this.channel };

    if (this.after !== null)
      qs.after = this.after;

    if (this.limit !== null)
      qs.limit = this.limit;

    return qs;
  }
}

