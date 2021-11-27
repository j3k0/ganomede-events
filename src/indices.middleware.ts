// restify middleware that get and post an index
// it will create dynamic index to load some grouped data like blocked users
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

import { logger } from './logger';
import bunyan from 'bunyan';
import { Poll } from './poll';
import { EventsStore } from './events.store';
import { GetIndicesEventsParam, parseIndicesGetParams, parseIndicesPostParams } from './parse-http-params';
import { IndexerStorage } from './indexer/indexerSorage';
import { RedisClient } from 'redis';
import { IndexerStreamProcessor } from './indexer/IndexerStreamProcessor';
import async from 'async';
import { IndexDefinition } from './models/IndexDefinition';

export const createGetMiddleware = (poll: Poll, store: EventsStore, indexerStorage: IndexerStorage,
  indexerProcessor: IndexerStreamProcessor,
  log: bunyan = logger) => (req: Request, res: Response, next: NextFunction) => {

    let params = parseIndicesGetParams(req.params);
    if (params instanceof Error)
      return next(new InvalidContentError(params.message));

    //getting the index-definition
    const getIndexDefinition = (cb) => {
      indexerStorage.getIndexDefinition((params as GetIndicesEventsParam).indexId, cb);
    };

    //process events from the last-fetched one.
    const processEvents = (indexDef: IndexDefinition, cb) => {
      indexerProcessor.processEvents(indexDef, (e: Error | null, results: any) => {
        cb(e, indexDef);
      });
    };

    //fetch all the events ids from the storage indexer
    const fetchEventIds = (indexDef: IndexDefinition, cb) => {
      indexerStorage.getEventIds(indexDef.id, (params as GetIndicesEventsParam).indexValue, (e: Error | null, res?: any[] | null) => {
        cb(e, indexDef, res);
      });
    };

    // we have now the events ids, so calling the store to get the list of events based ont their event-ids
    const fetchEventsFromStore = (indexDef: IndexDefinition, eventIds: number[], cb: (e?: Error | null, res?: any[] | null) => void) => {
      store.getEventsByIds(indexDef.channel, eventIds, cb);
    };

    //prepare the last response to return to the client.
    const prepareLastResponse = (indexDef: IndexDefinition, result: any, cb) => {
      let response = {
        "id": (params as GetIndicesEventsParam).indexId,
        "field": indexDef.field,
        "value": (params as GetIndicesEventsParam).indexValue,
        "rows": result
      }
      cb(null, response);
    }

    //work all the previous methods in a series and get the result from previous to the next one..
    async.waterfall([
      getIndexDefinition,
      processEvents,
      fetchEventIds,
      fetchEventsFromStore,
      prepareLastResponse
    ], function (err, result) {

      if (err) {
        log.error(err, 'waterfall.getIndexDefinition+processEvents failed');
        return next(err);
      }

      res.json(result);
      next();
    });
  };

export const createPostMiddleware = (store: EventsStore, indexerStorage: IndexerStorage,
  log: bunyan = logger) => (req: Request, res: Response, next: NextFunction) => {

    let params = parseIndicesPostParams(req.params);
    if (params instanceof Error)
      return next(new InvalidContentError(params.message));

    //calling indexerStorage to create an index.
    indexerStorage.createIndex(params, (e: Error | null, results: any[] | null | undefined) => {
      if (e) {
        log.error(e, 'indexerStorage.createIndex failed');
        return next(e);
      }
      res.json(results);
      next();
    });
  };
