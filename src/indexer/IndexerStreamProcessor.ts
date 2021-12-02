/**
 * Indexer Stream Processor:
 * the one main functionality for this class is to get all-non-processed events and add them to the
 * index definition using StorageIndexer.
 * we will be adding the event-ids only to the index (defined in StorageIndexer) in redis.
 * For each event in the stream, we access the value for the field to index
 */

import { EventsStore } from "../events.store";
import { Poll } from "../poll";
import { IndexerStorage } from "./indexerSorage";
import { PollEventsParams, pollForEvents } from '../poll-for-events';
import { IndexDefinition } from "../models/IndexDefinition";
import { DefinedHttpError } from "restify-errors";
import bunyan from "bunyan";
import { logger } from '../logger';
import lodash from 'lodash';
import async from "async";


export class IndexerStreamProcessor {

  poll: Poll;
  store: EventsStore;
  indexerStorage: IndexerStorage;
  log: bunyan;


  constructor(poll: Poll, store: EventsStore, indexerStorage: IndexerStorage, log: bunyan = logger) {
    this.poll = poll;
    this.store = store;
    this.indexerStorage = indexerStorage;
    this.log = log;
  }

  //process last fetched events, and add them to storageIndexer
  processEvents(indexDefinition: IndexDefinition, cb: (e: Error | null, results: any | null) => void) {
    let params: PollEventsParams = {
      channel: indexDefinition.channel,
      clientId: indexDefinition.id,
      after: 0,
      limit: 100,
      afterExplicitlySet: false
    };

    pollForEvents(this.store, this.poll, params, (err: Error | DefinedHttpError | null, events?: any) => {

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
          return cb(err, null);
        }
        cb(null, data);
      });

    })
  }

}
