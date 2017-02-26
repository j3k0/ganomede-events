'use strict';

const url = require('url');
const config = require('../../config');
const Client = require('../../src/client/Client');
describe('Client', () => {
  describe('listening for events', () => {
    const createClient = () => {
      const client = new Client('clientId', Object.assign(
        {secret: config.secret},
        url.parse('http://localhost:3000/events/v1')
      ));

      td.replace(client.request, 'get', td.function());
      return client;
    };

    it('keeps reqeusting new messages', (done) => {
      const client = createClient();
      let nEmits = 0;
      let nCalls = 0;

      td.when(client.request.get(td.matchers.isA(Object), td.matchers.isA(Function)))
        .thenDo((cursor, cb) => {
          ++nCalls;
          setImmediate(cb, null, [
            {from: 'service', type: 'type'},
            {from: 'service', type: 'type'},
          ]);
        });

      const handler = event => {
        ++nEmits;
        if (nEmits === 2) {
          // first we receive 2 messages from one channel
          client.removeListener('service:type', handler);
        }
        else if (nEmits === 4) {
          // then 2 messages from another
          client.removeListener('service', handler);
        }
        else if (nEmits > 4)
          done(new Error('oops too many emits ' + nEmits));
      };

      client.on('service:type', handler);
      client.on('service', handler);
      client.on('drain', () => {
        expect(nCalls).to.equal(2);
        done();
      });
    });

    it('#once() works without rescheduling', (done) => {
      const client = createClient();
      const expectedEvent = {from: 'ch', type: 'type'};
      let nEmits = 0;
      let nCalls = 0;

      td.when(client.request.get(td.matchers.isA(Object), td.matchers.isA(Function)))
        .thenDo((cursor, cb) => {
          ++nCalls;
          setImmediate(cb, null, [
            expectedEvent,
            {from: 'ch', type: 'second event that will get "ignored"'}
          ]);
        });

      // this gets called first
      client.once('ch', (event) => {
        ++nEmits;
        expect(event).to.equal(expectedEvent);
        expect(nCalls).to.equal(1);
        expect(nEmits).to.equal(1);
      });

      client.once('ch', (event) => {
        ++nEmits;
        expect(event).to.equal(expectedEvent);
      });

      client.once('drain', (event) => {
        expect(nCalls).to.equal(1);
        expect(nEmits).to.equal(2);
        done();
      });
    });

    it('subscribing multiple times does not trigger multiple simultaneous requests', (done) => {
      const client = createClient();
      const calls = [];
      let nEmits = 0;

      td.when(client.request.get(td.matchers.isA(Object), td.matchers.isA(Function)))
        .thenDo((cursor, cb) => {
          calls.push(cursor.channel);
          setImmediate(cb, null, [
            {from: 'ch', type: 'type'},
            {from: 'ch2', type: 'type'}
          ]);
        });

      const handler = (channel) => {
        const myself = (event) => {
          ++nEmits;
          client.removeListener(channel, myself);
        };

        return myself;
      };

      client.on('ch', handler('ch'));                 // 1 (emit because removes after call)
      client.on('ch:type', handler('ch:type'));       // 1 (emit because removes after call)
      client.once('ch2', () => ++nEmits);             // 1
      client.once('ch2:type', () => ++nEmits);        // 1

      client.on('drain', () => {
        expect(nEmits).to.equal(4);
        expect(calls).to.eql(['ch', 'ch:type', 'ch2', 'ch2:type']);
        done();
      });
    });
  });

  describe('#send()', () => {
    const createClient = () => {
      const client = new Client('clientId', Object.assign(
        {secret: config.secret},
        url.parse('http://localhost:3000/events/v1')
      ));

      td.replace(client.request, 'post', td.function());
      return client;
    };

    it('sends events with data', (done) => {
      const client = createClient();
      const header = {id: 1, timestamp: Date.now()};

      td.when(client.request.post('event-type', {something: true}, td.callback))
        .thenCallback(null, header);

      client.send('event-type', {something: true}, (err, header) => {
        expect(err).to.be.null;
        expect(header).to.eql(header);
        done();
      });
    });

    it('sends events with no data', (done) => {
      const client = createClient();
      const header = {id: 1, timestamp: Date.now()};

      td.when(client.request.post('event-type', null, td.callback))
        .thenCallback(null, header);

      client.send('event-type', (err, header) => {
        expect(err).to.be.null;
        expect(header).to.eql(header);
        done();
      });
    });
  });
});
