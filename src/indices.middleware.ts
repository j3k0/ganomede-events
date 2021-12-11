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
import { EventsStore } from './events.store';
import { GetIndicesEventsParam, parseIndicesGetParams, parseIndicesPostParams } from './parse-http-params';
import { IndexerStorage } from './indexer/indexer-storage';
import { IndexerStreamProcessor } from './indexer/indexer-stream-processor';
import async from 'async';
import { IndexDefinition } from './models/index-definition';
import { GetIndexEventsResult } from './models/get-index-events-result';

/**
* Get the list of events by an index (middleware):

* This middleware will be validating the request params, then it should do the following in an ordered way:

* 1- Get the index definition from redis by its key [getIndexDefinition]
*    ex: "indices:blocked-users-by-username" => { "id": "blocked-users-by-username", "channel": "users/v1/blocked-users", "field": "data.username"}

* 2- Process the events, get all events using PollForEvents which are not processed yet. [processEvents]
*    Then store the event-ids in the index in redis.

* 3- Then we need to fetch all event-ids from the index, [fetchEventIds]
*    in order to prepare the result to response.

* 4- Then from the event-ids we need to get the events array (actual events from redis.store) [fetchEventsFromStore]
*    So using "getEventsByIds" from the store, we can get all events by using their ids.

* 5- At last, [prepareLastResponse] preparing the last response to be sent to the requester.
*/
export const createGetMiddleware = (store: EventsStore, indexerStorage: IndexerStorage,
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
    const fetchEventsFromStore = (indexDef: IndexDefinition, eventIds: string[], cb) => {
      store.getEventsByIds(indexDef.channel, eventIds, (er?: Error | null, res?: any) => {
        cb(er, indexDef, res);
      });
    };

    //prepare the last response to return to the client.
    const prepareLastResponse = (indexDef: IndexDefinition, result: any, cb: (e: Error | null, r: GetIndexEventsResult) => void) => {
      let response: GetIndexEventsResult = {
        id: (params as GetIndicesEventsParam).indexId,
        field: indexDef.field,
        value: (params as GetIndicesEventsParam).indexValue,
        rows: result
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

/**
* Create an index in redis (middleware):

* This middleware will be validating the request params (body), then it should create a dynamic index

* in redis => from this { "id": "blocked-users-by-username", "channel": "users/v1/blocked-users", "field": "data.username"}

* so Final result in redis will be:
* "indices:blocked-users-by-username" => { "id": "blocked-users-by-username", "channel": "users/v1/blocked-users", "field": "data.username"}
*/
export const createPostMiddleware = (indexerStorage: IndexerStorage,
  log: bunyan = logger) => (req: Request, res: Response, next: NextFunction) => {
    let params = parseIndicesPostParams(req.body);
    if (params instanceof Error)
      return next(new InvalidContentError(params.message));

    //calling indexerStorage to create an index.
    indexerStorage.createIndex(params, (e: Error | null, results?: string) => {
      if (e) {
        log.error(e, 'indexerStorage.createIndex failed');
        return next(e);
      }
      res.json(results);
      next();
    });
  };
