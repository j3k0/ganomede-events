// restify middleware that loads and outputs events
// from a given channel
//
// GET parameters:
//  - after: event id (string)
//           only output events newer than this
//           (can be undefined for all events)
//  - channel: string
//             channel to load events from
//
// Reponds with a JSON array of events (see README.md)
//
import { Request, Response, Next as NextFunction } from 'restify';
import { InvalidContentError, DefinedHttpError } from 'restify-errors';
import { parseGetParams } from './parse-http-params';
import { pollForEvents } from './poll-for-events';

import { Poll } from './poll';
import { logger } from './logger';
import bunyan from 'bunyan';
import { EventsStore } from './events.store';

export const createMiddleware = (
  poll: Poll, // = createPoll,
  store: EventsStore,
  log: bunyan = logger) => (req: Request, res: Response, next: NextFunction) => {
    const params = parseGetParams(req.query);
    if (params instanceof Error)
      return next(new InvalidContentError(params.message));

    pollForEvents(store, poll, params, (err: Error | DefinedHttpError | null, events: []) => {
      if (err) {
        log.error(err);
        return next(err);
      }

      res.json(events);
      next();
    });
  };
