
import { InternalServerError, DefinedHttpError } from 'restify-errors';
import { EventsStore } from './events.store';
import { Poll } from './poll';
import { LoadEventsParamType } from './events.store';

export const pollForEvents = (store: EventsStore, poll: Poll, params: any, callback: (err: Error | null | DefinedHttpError, res?: any) => void) => {
  const { after, channel } = params;

  const _loadEventsparams: LoadEventsParamType = params;

  const loadEvents = (cb: (e: Error | null | undefined, res?: any) => void) =>
    store.loadEvents(channel, _loadEventsparams, cb);


  // Process the outcome of store.loadEvents,
  // returns true iff the middleware's job is over (next was called).
  const processLoad = (err: Error | null | undefined, events: [], minimalEventsCount = 0) => {
    if (err) {
      callback(err);
      return true;
    }

    if (events.length >= minimalEventsCount) {
      callback(null, events);
      return true;
    }

    return false;
  };

  // Process the outcome of poll.listen
  //  - when a new message is received,
  //         -> reload and output events.
  //  - when no new messages are received,
  //         -> output an empty array
  const processPoll = (err: Error | null, message: string | number | null) => {
    if (err)
      return callback(new InternalServerError('polling failed'));
    else {
      if (message && message > after)
        return loadEvents(processLoad);
      else
        return processLoad(null, []); // timeout is not an error but expected behavior
    }
  };

  const pollEvents = () => poll.listen(channel, processPoll);

  loadEvents((err: Error | null | undefined, events: []) => {
    (processLoad(err, events, 1) || pollEvents())
  });
};
