import { EventsStore } from "../events.store";
import { Poll } from "../poll";
import { IndexerStorage } from "./indexerSorage";
import { pollForEvents } from '../poll-for-events';
import { IndexDefinition } from "../models/IndexDefinition";
import { parseGetParams } from "../parse-http-params";
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
    let params = parseGetParams({ channel: indexDefinition.channel, clientId: indexDefinition.id });
    pollForEvents(this.store, this.poll, params, (err: Error | DefinedHttpError | null, events?: any) => {
      if (err) {
        this.log.error(err, 'processEvents.pollForEvents failed');
        return cb(err, null);
      }
      let that = this;
      let tasks: any[] = [];

      //foreeach event fetchec, we need to add to the index in a series way.
      events.forEach(event => {

        let value = lodash.get(event, indexDefinition.field, 'NOT_FOUND');
        tasks.push(cb2 => that.indexerStorage.addToIndex(indexDefinition, event, value, cb2));
      });

      //run async.series accross the adding tasks to the storage indexer.
      async.series(tasks, (err, data) => {
        if (err) {
          return cb(err, null);
        }
        cb(null, data);
      });

    })
  }

}
