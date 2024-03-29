// restify middleware that loads and outputs latest events
// from a given channel
//
// GET parameters:
//  - channel: string
//             channel to load events from
//  - limit: number (optional)
//             limit the number to show
//
// Reponds with a JSON array of events (see README.md)
//

import { Request, Response, Next as NextFunction } from 'restify';

import { InvalidContentError } from 'restify-errors';
import { parseLatestGetParams } from './parse-http-params';
import { EventsStore } from './events.store';

export const createMiddleware = (
  store: EventsStore
) => (req: Request, res: Response, next: NextFunction) => {
  const params = parseLatestGetParams(req.query);
  if (params instanceof Error)
    return next(new InvalidContentError(params.message));

  const { channel, limit } = params;
  store.loadLatestItems(channel, limit, (err: Error | null | undefined, data: any[]) => {

    if (err)
      return next(err);

    res.json(data);
    next();
  });

};
