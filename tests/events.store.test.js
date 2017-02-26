'use strict';

const {createStore} = require('../src/events.store');

describe('events.store', () => {
  describe('#addEvent()', () => {
    const now = Date.now();
    let actualEvent;

    before((done) => {
      const itemsStore = td.object(['getIndex', 'addItem']);
      const subject = createStore({itemsStore});
      const expectedHeader = td.matchers.contains({
        id: 5,
        timestamp: now
      });

      td.replace(Date, 'now', () => now);

      td.when(itemsStore.getIndex('channel', td.callback))
        .thenCallback(null, 5);

      td.when(itemsStore.addItem('channel', expectedHeader, td.callback))
        .thenCallback(null);

      subject.addEvent('channel', {from: 'me', type: 'kind', data: {}}, (err, event) => {
        expect(err).to.be.null;
        actualEvent = event;
        done();
      });
    });

    it('returns object', () => {
      expect(actualEvent).to.be.ok;
      expect(actualEvent).to.be.instanceof(Object);
    });

    it('fills in event ID based on store channel index', () => {
      expect(actualEvent.id).to.equal(5);
    });

    it('fills in event timestamp', () => {
      expect(actualEvent.timestamp).to.equal(now);
    });
  });

  describe('#loadEvents()', () => {
    it('calls down to store implementation', (done) => {
      const itemsStore = td.object(['loadItems']);
      const subject = createStore({itemsStore});

      td.when(itemsStore.loadItems('ch', 5, 100, td.callback))
        .thenCallback(null, [1, 2, 3]);

      subject.loadEvents('ch', 5, 100, (err, events) => {
        expect(err).to.be.null;
        expect(events).to.eql([1, 2, 3]);
        done();
      });
    });
  });
});
