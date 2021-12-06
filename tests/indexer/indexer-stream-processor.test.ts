import { Event, EventsStore } from '../../src/events.store';
import { IndexerStreamProcessor } from '../../src/indexer/indexer-stream-processor';
import td from 'testdouble';
import { Poll } from '../../src/poll';
import { IndexerStorage } from '../../src/indexer/indexer-storage';
import Logger from 'bunyan';
import { expect } from 'chai';
import { EventsPoller, PollEventsParams } from '../../src/poll-for-events';
import { DefinedHttpError } from 'restify-errors';

describe('IndexerStreamProcessor', () => {

  describe('#constructor', () => {
    it('returns an IndexerStreamProcessor', () => {
      const processor = new IndexerStreamProcessor(td.object<Poll>(), td.object<EventsStore>(), td.object<IndexerStorage>(), td.object<Logger>());
      expect(processor).to.be.ok;
    })
  });

  describe('#processEvents()', () => {

    const createDoubles = () => {
      return {
        poll: td.object<Poll>(),
        store: td.object<EventsStore>(),
        storage: td.object<IndexerStorage>(),
        logger: td.object<Logger>(),
        pollForEvents: td.function<EventsPoller>(),
      };
    }

    function expectedParams(limit: number = 100000): PollEventsParams {
      return {
        clientId: 'my-index',
        channel: 'my-channel',
        after: 0,
        limit,
        afterExplicitlySet: false
      }
    };

    const indexDefinition = {
      id: 'my-index',
      channel: 'my-channel',
      field: 'data.field'
    };

    it('tries to load 100000 events from the index associated channel', () => {
      const doubles = createDoubles();
      const processor = new IndexerStreamProcessor(doubles.poll, doubles.store, doubles.storage, doubles.logger, doubles.pollForEvents);
      processor.processEvents(indexDefinition, (err, results) => { });
      td.verify(doubles.pollForEvents(doubles.store, doubles.poll, expectedParams(), td.callback));
    });

    it('fails if pollForEvents fails', (done) => {
      const doubles = createDoubles();
      const processor = new IndexerStreamProcessor(doubles.poll, doubles.store, doubles.storage, doubles.logger, doubles.pollForEvents);
      td.when(doubles.pollForEvents(doubles.store, doubles.poll, expectedParams(), td.callback))
        .thenCallback(new Error('my-error'), null);
      processor.processEvents(indexDefinition, (err, results) => {
        expect(err?.message).to.equal('my-error');
        expect(results).to.be.null;
        done();
      });
    });

    let counter = 1;
    const eventWithData = (data: any): Event => ({
      id: counter++,
      timestamp: +new Date(),
      type: 'event-type',
      from: 'event-sender',
      data
    });

    it('adds the new events into the index', (done) => {
      const doubles = createDoubles();
      const processor = new IndexerStreamProcessor(doubles.poll, doubles.store, doubles.storage, doubles.logger, doubles.pollForEvents);
      const newEvent: Event = eventWithData({ field: 'my-field-value' });
      const addResult = { result: 'added-to-index' };
      td.when(doubles.pollForEvents(doubles.store, doubles.poll, expectedParams(), td.callback))
        .thenCallback(null, [newEvent]);
      td.when(doubles.storage.addToIndex(indexDefinition, newEvent, 'my-field-value', td.callback))
        .thenCallback(null, addResult);
      processor.processEvents(indexDefinition, (err, results) => {
        expect(err).to.be.null;
        expect(results).to.eql([addResult]);
        done();
      });
    });

    it('does not add events with when the field is absent', (done) => {
      const doubles = createDoubles();
      const processor = new IndexerStreamProcessor(doubles.poll, doubles.store, doubles.storage, doubles.logger, doubles.pollForEvents);
      const newEvent: Event = eventWithData({ otherField: 'my-field-value' });
      const addResult = { result: 'added-to-index' };
      td.when(doubles.pollForEvents(doubles.store, doubles.poll, expectedParams(), td.callback))
        .thenCallback(null, [newEvent]);
      processor.processEvents(indexDefinition, (err, results) => {
        expect(err).to.be.null;
        td.verify( // verify that no event were added to events storage
          doubles.storage.addToIndex(td.matchers.anything(), td.matchers.anything(), td.matchers.anything(), td.callback),
          { times: 0 });
        expect(results).to.eql([]);
        done();
      });
    });

    it('polls repeatidly when there are more unprocessed events than the polling limit', (done) => {
      const limit = 10;
      const doubles = createDoubles();
      const processor = new IndexerStreamProcessor(doubles.poll, doubles.store, doubles.storage, doubles.logger, doubles.pollForEvents);
      processor.pollingLimit = limit;
      const newEvents: Event[] = [];
      while (newEvents.length < limit + 1) {
        newEvents.push(eventWithData({ field: 'my-field-value' }));
      }
      let pendingEvents: Event[] = newEvents.slice();
      const addResult = { result: 'added-to-index' };
      td.when(doubles.pollForEvents(doubles.store, doubles.poll, expectedParams(limit), td.matchers.anything()))
        .thenDo((_store, _poll, _params, cb) => {
          setImmediate(cb, null, pendingEvents.slice(0, limit));
          pendingEvents = pendingEvents.slice(limit);
        });
      const added = {};
      td.when(doubles.storage.addToIndex(td.matchers.anything(), td.matchers.anything(), td.matchers.anything(), td.matchers.anything()))
        .thenDo((_definition, event:Event, _value:string, cb) => {
          added[event.id] = true;
          cb(null);
        });
      processor.processEvents(indexDefinition, (err, results) => {
        expect(err).to.be.null;
        // All events have been added to storage.
        expect(pendingEvents.length).to.equal(0);
        newEvents.forEach(e => {
          expect(added[e.id]).to.equal(true);
        });
        done();
      });
    });
  });
});
