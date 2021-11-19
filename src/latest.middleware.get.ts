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

import { InvalidContentError, Request, Response } from 'restify';
import { parseLatestGetParams } from './parse-http-params';
import { NextFunction } from 'express';
import { EventsStore } from './events.store';

export const createMiddleware = (
  store: EventsStore
) => (req: Request, res: Response, next: NextFunction) => {
  const params = parseLatestGetParams(req.params);
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
