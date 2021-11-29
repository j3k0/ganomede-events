import { Request, Response, Next as NextFunction } from 'restify';
import { InvalidContentError } from 'restify-errors';
import { parsePostParams } from './parse-http-params';

import { Poll } from './poll';
import { logger } from './logger';
import bunyan from 'bunyan';
import { EventsStore } from './events.store';

export const createMiddleware = (
  poll: Poll, // = createPoll,
  store: EventsStore,
  log: bunyan = logger
) => (req: Request, res: Response, next: NextFunction) => {
  const params = parsePostParams(req.body);
  if (params instanceof Error)
    return next(new InvalidContentError(params.message));

  const { channel, event } = params;

  store.addEvent(channel, event, (err: Error | null | undefined, event: any) => { // (err: Error, event) => {

    if (err)
      return next(err);

    res.json(event);
    next();
    // notify poll listeners of the new event (in background)
    poll.emit(channel, event.id, (err: Error | null) => {

      // ignore success, log errors
      if (err)
        log.error(err, 'poll.trigger failed');
    });
  });
};
