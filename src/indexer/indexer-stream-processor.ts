/**
 * Indexer Stream Processor:
 * the one main functionality for this class is to get all-non-processed events and add them to the
 * index definition using StorageIndexer.
 * we will be adding the event-ids only to the index (defined in StorageIndexer) in redis.
 * For each event in the stream, we access the value for the field to index
 */

import { EventsStore } from "../events.store";
import { Poll } from "../poll";
import { IndexerStorage } from "./indexer-storage";
import { EventsPoller, PollEventsParams, pollForEvents as defaultPollForEvents } from '../poll-for-events';
import { IndexDefinition } from "../models/index-definition";
import { DefinedHttpError, InternalServerError } from "restify-errors";
import bunyan from "bunyan";
import { logger } from '../logger';
import lodash from 'lodash';
import async from "async";


export class IndexerStreamProcessor {

  poll: Poll;
  store: EventsStore;
  indexerStorage: IndexerStorage;
  log: bunyan;
  pollForEvents: EventsPoller;
  pollingLimit: number;

  constructor(poll: Poll, store: EventsStore, indexerStorage: IndexerStorage, log: bunyan = logger, pollForEvents: EventsPoller = defaultPollForEvents) {
    this.poll = poll;
    this.store = store;
    this.indexerStorage = indexerStorage;
    this.log = log;
    this.pollForEvents = pollForEvents;
    this.pollingLimit = 100000;
  }

  //process last fetched events, and add them to storageIndexer
  processEvents(indexDefinition: IndexDefinition, cb: (e: Error | null, results: any | null) => void) {

    // We should poll every unprocessed event.
    // Setting a very high limit so we don't stall the server.
    // This will fail if there are more than 100000 unprocessed events.
    // If the number of returned events is equal to params.limit, we'll just fail the request,
    // so the client retries it until all events have been processed.
    // A better solution would be to repeatedly poll until the number of returned events is lower
    // than params.limit.
    let params: PollEventsParams = {
      channel: indexDefinition.channel,
      clientId: indexDefinition.id,
      after: 0,
      limit: this.pollingLimit,
      afterExplicitlySet: false
    };

    this.pollForEvents(this.store, this.poll, params, (err: Error | DefinedHttpError | null, events?: any) => {

      if (err) {
        this.log.error(err, 'processEvents.pollForEvents failed');
        return cb(err, null);
      }
      let that = this;
      let tasks: any[] = [];

      //foreeach event fetchec, we need to add to the index in a series way.
      events.forEach(event => {

        let value = lodash.get(event, indexDefinition.field, undefined);
        if (value !== null && value !== undefined && typeof value === "string") {
          tasks.push(cb2 => that.indexerStorage.addToIndex(indexDefinition, event, value, cb2));
        }
      });

      //run async.series accross the adding tasks to the storage indexer.
      async.parallel(tasks, (err, data) => {
        if (err) {
          cb(err, null);
        }
        else if (events.length === params.limit) {
          cb(new InternalServerError('Too many unprocessed events, please repeat the request.'), null);
        }
        else {
          cb(null, data);
        }
      });

    })
  }

}
