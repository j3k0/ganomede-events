import {expect} from 'chai';
import td from 'testdouble';
import {config} from '../../config';
import { Cursor } from '../../src/client/Cursor';

const url = require('url');
import {Client} from '../../src/client/Client';

describe('Client', () => {
  describe('new Client()', () => {
    it('default prefix is correct', () => {
      const client = new Client('someId', {secret: '1'});
      expect(client.client.pathPrefix).to.equal('/events/v1');
    });
  });

  describe('listening for events', () => {
    const createClient = () => {
      const client = new Client('clientId', Object.assign(
        {secret: config.secret},
        url.parse('http://localhost:3000/events/v1')
      ));

      td.replace(client.client, 'getEvents', td.function());
      return client;
    };

    it('keeps reqeusting new messages', (done) => {
      const client = createClient();
      let nEmits = 0;
      let nCalls = 0;

      td.when(client.client.getEvents(td.matchers.isA(Object), td.matchers.isA(Function)))
        .thenDo((cursor: Cursor, cb: (...args: any[]) => void) => {
          ++nCalls;
          setImmediate(cb, null, [
            {from: 'service', type: 'type'},
            {from: 'service', type: 'type'},
          ]);
        });

      const handler = () => {
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

      td.when(client.client.getEvents(td.matchers.isA(Object), td.matchers.isA(Function)))
        .thenDo((cursor: Cursor, cb: (...args: any[]) => void) => {
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
      const calls: any[] = [];
      let nEmits = 0;

      td.when(client.client.getEvents(td.matchers.isA(Object), td.matchers.isA(Function)))
        .thenDo((cursor: Cursor, cb: (...args: any[]) => void) => {
          calls.push(cursor.channel as never);
          setImmediate(cb, null, [
            {from: 'ch', type: 'type'},
            {from: 'ch2', type: 'type'}
          ]);
        });

      const handler = (channel: string) => {
        const myself = () => {
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

    it('emits `cycle(channel)` after every request', (done) => {
      const client = createClient();
      const handler = () => { throw new Error('Should never be here'); };
      let cycleCount = 0;

      // Assume we have no events with this request, but want to detach listener.
      td.when(client.client.getEvents(td.matchers.isA(Object), td.matchers.isA(Function)))
        .thenDo((cursor: Cursor, cb: (...args: any[]) => void) => setImmediate(cb, null, []));

      // These will never trigger.
      client.on('ch', handler);
      client.on('error', handler);

      // But we still want an ability to do something inbetween requests.
      client.on('cycle', ({finished, next}, channel) => {
        expect(channel).to.eql('ch');
        client.removeListener(channel, handler);
        ++cycleCount;
      });

      client.on('drain', () => {
        expect(cycleCount).to.equal(1);
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

      td.replace(client.client, 'sendEvent', td.function());
      return client;
    };

    it('sends events with data', (done) => {
      const client = createClient();
      const reply = {id: 1, timestamp: Date.now()};

      td.when(client.client.sendEvent('someplace', {from: 'me', type: 'x'}, td.callback))
        .thenCallback(null, reply);

      client.send('someplace', {from: 'me', type: 'x'}, (err: Error, header: any) => {
        expect(err).to.be.null;
        expect(header).to.eql(reply);
        done();
      });
    });
  });
});
