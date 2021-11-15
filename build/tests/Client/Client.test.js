'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const testdouble_1 = __importDefault(require("testdouble"));
const url = require('url');
const config = require('../../config');
const Client = require('../../src/client/Client');
describe('Client', () => {
    describe('new Client()', () => {
        it('default prefix is correct', () => {
            const client = new Client('someId', { secret: '1' });
            (0, chai_1.expect)(client.client.pathPrefix).to.equal('/events/v1');
        });
    });
    describe('listening for events', () => {
        const createClient = () => {
            const client = new Client('clientId', Object.assign({ secret: config.secret }, url.parse('http://localhost:3000/events/v1')));
            testdouble_1.default.replace(client.client, 'getEvents', testdouble_1.default.function());
            return client;
        };
        it('keeps reqeusting new messages', (done) => {
            const client = createClient();
            let nEmits = 0;
            let nCalls = 0;
            testdouble_1.default.when(client.client.getEvents(testdouble_1.default.matchers.isA(Object), testdouble_1.default.matchers.isA(Function)))
                .thenDo((cursor, cb) => {
                ++nCalls;
                setImmediate(cb, null, [
                    { from: 'service', type: 'type' },
                    { from: 'service', type: 'type' },
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
                (0, chai_1.expect)(nCalls).to.equal(2);
                done();
            });
        });
        it('#once() works without rescheduling', (done) => {
            const client = createClient();
            const expectedEvent = { from: 'ch', type: 'type' };
            let nEmits = 0;
            let nCalls = 0;
            testdouble_1.default.when(client.client.getEvents(testdouble_1.default.matchers.isA(Object), testdouble_1.default.matchers.isA(Function)))
                .thenDo((cursor, cb) => {
                ++nCalls;
                setImmediate(cb, null, [
                    expectedEvent,
                    { from: 'ch', type: 'second event that will get "ignored"' }
                ]);
            });
            // this gets called first
            client.once('ch', (event) => {
                ++nEmits;
                (0, chai_1.expect)(event).to.equal(expectedEvent);
                (0, chai_1.expect)(nCalls).to.equal(1);
                (0, chai_1.expect)(nEmits).to.equal(1);
            });
            client.once('ch', (event) => {
                ++nEmits;
                (0, chai_1.expect)(event).to.equal(expectedEvent);
            });
            client.once('drain', (event) => {
                (0, chai_1.expect)(nCalls).to.equal(1);
                (0, chai_1.expect)(nEmits).to.equal(2);
                done();
            });
        });
        it('subscribing multiple times does not trigger multiple simultaneous requests', (done) => {
            const client = createClient();
            const calls = [];
            let nEmits = 0;
            testdouble_1.default.when(client.client.getEvents(testdouble_1.default.matchers.isA(Object), testdouble_1.default.matchers.isA(Function)))
                .thenDo((cursor, cb) => {
                calls.push(cursor.channel);
                setImmediate(cb, null, [
                    { from: 'ch', type: 'type' },
                    { from: 'ch2', type: 'type' }
                ]);
            });
            const handler = (channel) => {
                const myself = (event) => {
                    ++nEmits;
                    client.removeListener(channel, myself);
                };
                return myself;
            };
            client.on('ch', handler('ch')); // 1 (emit because removes after call)
            client.on('ch:type', handler('ch:type')); // 1 (emit because removes after call)
            client.once('ch2', () => ++nEmits); // 1
            client.once('ch2:type', () => ++nEmits); // 1
            client.on('drain', () => {
                (0, chai_1.expect)(nEmits).to.equal(4);
                (0, chai_1.expect)(calls).to.eql(['ch', 'ch:type', 'ch2', 'ch2:type']);
                done();
            });
        });
        it('emits `cycle(channel)` after every request', (done) => {
            const client = createClient();
            const handler = () => { throw new Error('Should never be here'); };
            let cycleCount = 0;
            // Assume we have no events with this request, but want to detach listener.
            testdouble_1.default.when(client.client.getEvents(testdouble_1.default.matchers.isA(Object), testdouble_1.default.matchers.isA(Function)))
                .thenDo((cursor, cb) => setImmediate(cb, null, []));
            // These will never trigger.
            client.on('ch', handler);
            client.on('error', handler);
            // But we still want an ability to do something inbetween requests.
            client.on('cycle', ({ finished, next }, channel) => {
                (0, chai_1.expect)(channel).to.eql('ch');
                client.removeListener(channel, handler);
                ++cycleCount;
            });
            client.on('drain', () => {
                (0, chai_1.expect)(cycleCount).to.equal(1);
                done();
            });
        });
    });
    describe('#send()', () => {
        const createClient = () => {
            const client = new Client('clientId', Object.assign({ secret: config.secret }, url.parse('http://localhost:3000/events/v1')));
            testdouble_1.default.replace(client.client, 'sendEvent', testdouble_1.default.function());
            return client;
        };
        it('sends events with data', (done) => {
            const client = createClient();
            const reply = { id: 1, timestamp: Date.now() };
            testdouble_1.default.when(client.client.sendEvent('someplace', { from: 'me', type: 'x' }, testdouble_1.default.callback))
                .thenCallback(null, reply);
            client.send('someplace', { from: 'me', type: 'x' }, (err, header) => {
                (0, chai_1.expect)(err).to.be.null;
                (0, chai_1.expect)(header).to.eql(reply);
                done();
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2xpZW50LnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi90ZXN0cy9DbGllbnQvQ2xpZW50LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7OztBQUViLCtCQUE0QjtBQUM1Qiw0REFBNEI7QUFFNUIsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzNCLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUN2QyxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMseUJBQXlCLENBQUMsQ0FBQztBQUVsRCxRQUFRLENBQUMsUUFBUSxFQUFFLEdBQUcsRUFBRTtJQUN0QixRQUFRLENBQUMsY0FBYyxFQUFFLEdBQUcsRUFBRTtRQUM1QixFQUFFLENBQUMsMkJBQTJCLEVBQUUsR0FBRyxFQUFFO1lBQ25DLE1BQU0sTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLFFBQVEsRUFBRSxFQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUMsQ0FBQyxDQUFDO1lBQ25ELElBQUEsYUFBTSxFQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUMxRCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLHNCQUFzQixFQUFFLEdBQUcsRUFBRTtRQUNwQyxNQUFNLFlBQVksR0FBRyxHQUFHLEVBQUU7WUFDeEIsTUFBTSxNQUFNLEdBQUcsSUFBSSxNQUFNLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQ2pELEVBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxNQUFNLEVBQUMsRUFDdkIsR0FBRyxDQUFDLEtBQUssQ0FBQyxpQ0FBaUMsQ0FBQyxDQUM3QyxDQUFDLENBQUM7WUFFSCxvQkFBRSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLFdBQVcsRUFBRSxvQkFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDdEQsT0FBTyxNQUFNLENBQUM7UUFDaEIsQ0FBQyxDQUFDO1FBRUYsRUFBRSxDQUFDLCtCQUErQixFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUU7WUFDM0MsTUFBTSxNQUFNLEdBQUcsWUFBWSxFQUFFLENBQUM7WUFDOUIsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDO1lBQ2YsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDO1lBRWYsb0JBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsb0JBQUUsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLG9CQUFFLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO2lCQUNqRixNQUFNLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUU7Z0JBQ3JCLEVBQUUsTUFBTSxDQUFDO2dCQUNULFlBQVksQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFO29CQUNyQixFQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBQztvQkFDL0IsRUFBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUM7aUJBQ2hDLENBQUMsQ0FBQztZQUNMLENBQUMsQ0FBQyxDQUFDO1lBRUwsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLEVBQUU7Z0JBQ3RCLEVBQUUsTUFBTSxDQUFDO2dCQUNULElBQUksTUFBTSxLQUFLLENBQUMsRUFBRTtvQkFDaEIsK0NBQStDO29CQUMvQyxNQUFNLENBQUMsY0FBYyxDQUFDLGNBQWMsRUFBRSxPQUFPLENBQUMsQ0FBQztpQkFDaEQ7cUJBQ0ksSUFBSSxNQUFNLEtBQUssQ0FBQyxFQUFFO29CQUNyQiwrQkFBK0I7b0JBQy9CLE1BQU0sQ0FBQyxjQUFjLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO2lCQUMzQztxQkFDSSxJQUFJLE1BQU0sR0FBRyxDQUFDO29CQUNqQixJQUFJLENBQUMsSUFBSSxLQUFLLENBQUMsc0JBQXNCLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUNyRCxDQUFDLENBQUM7WUFFRixNQUFNLENBQUMsRUFBRSxDQUFDLGNBQWMsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUNuQyxNQUFNLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUM5QixNQUFNLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUU7Z0JBQ3RCLElBQUEsYUFBTSxFQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzNCLElBQUksRUFBRSxDQUFDO1lBQ1QsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxvQ0FBb0MsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFO1lBQ2hELE1BQU0sTUFBTSxHQUFHLFlBQVksRUFBRSxDQUFDO1lBQzlCLE1BQU0sYUFBYSxHQUFHLEVBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFDLENBQUM7WUFDakQsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDO1lBQ2YsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDO1lBRWYsb0JBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsb0JBQUUsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLG9CQUFFLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO2lCQUNqRixNQUFNLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUU7Z0JBQ3JCLEVBQUUsTUFBTSxDQUFDO2dCQUNULFlBQVksQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFO29CQUNyQixhQUFhO29CQUNiLEVBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsc0NBQXNDLEVBQUM7aUJBQzNELENBQUMsQ0FBQztZQUNMLENBQUMsQ0FBQyxDQUFDO1lBRUwseUJBQXlCO1lBQ3pCLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsS0FBSyxFQUFFLEVBQUU7Z0JBQzFCLEVBQUUsTUFBTSxDQUFDO2dCQUNULElBQUEsYUFBTSxFQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUM7Z0JBQ3RDLElBQUEsYUFBTSxFQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzNCLElBQUEsYUFBTSxFQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDN0IsQ0FBQyxDQUFDLENBQUM7WUFFSCxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLEtBQUssRUFBRSxFQUFFO2dCQUMxQixFQUFFLE1BQU0sQ0FBQztnQkFDVCxJQUFBLGFBQU0sRUFBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ3hDLENBQUMsQ0FBQyxDQUFDO1lBRUgsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxLQUFLLEVBQUUsRUFBRTtnQkFDN0IsSUFBQSxhQUFNLEVBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDM0IsSUFBQSxhQUFNLEVBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDM0IsSUFBSSxFQUFFLENBQUM7WUFDVCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLDRFQUE0RSxFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUU7WUFDeEYsTUFBTSxNQUFNLEdBQUcsWUFBWSxFQUFFLENBQUM7WUFDOUIsTUFBTSxLQUFLLEdBQUcsRUFBRSxDQUFDO1lBQ2pCLElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQztZQUVmLG9CQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLG9CQUFFLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxvQkFBRSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztpQkFDakYsTUFBTSxDQUFDLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFO2dCQUNyQixLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFnQixDQUFDLENBQUM7Z0JBQ3BDLFlBQVksQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFO29CQUNyQixFQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBQztvQkFDMUIsRUFBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUM7aUJBQzVCLENBQUMsQ0FBQztZQUNMLENBQUMsQ0FBQyxDQUFDO1lBRUwsTUFBTSxPQUFPLEdBQUcsQ0FBQyxPQUFPLEVBQUUsRUFBRTtnQkFDMUIsTUFBTSxNQUFNLEdBQUcsQ0FBQyxLQUFLLEVBQUUsRUFBRTtvQkFDdkIsRUFBRSxNQUFNLENBQUM7b0JBQ1QsTUFBTSxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQ3pDLENBQUMsQ0FBQztnQkFFRixPQUFPLE1BQU0sQ0FBQztZQUNoQixDQUFDLENBQUM7WUFFRixNQUFNLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFpQixzQ0FBc0M7WUFDdEYsTUFBTSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBTyxzQ0FBc0M7WUFDdEYsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFhLElBQUk7WUFDcEQsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFRLElBQUk7WUFFcEQsTUFBTSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFO2dCQUN0QixJQUFBLGFBQU0sRUFBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUMzQixJQUFBLGFBQU0sRUFBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQztnQkFDM0QsSUFBSSxFQUFFLENBQUM7WUFDVCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLDRDQUE0QyxFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUU7WUFDeEQsTUFBTSxNQUFNLEdBQUcsWUFBWSxFQUFFLENBQUM7WUFDOUIsTUFBTSxPQUFPLEdBQUcsR0FBRyxFQUFFLEdBQUcsTUFBTSxJQUFJLEtBQUssQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ25FLElBQUksVUFBVSxHQUFHLENBQUMsQ0FBQztZQUVuQiwyRUFBMkU7WUFDM0Usb0JBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsb0JBQUUsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLG9CQUFFLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO2lCQUNqRixNQUFNLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxZQUFZLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRXRELDRCQUE0QjtZQUM1QixNQUFNLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztZQUN6QixNQUFNLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztZQUU1QixtRUFBbUU7WUFDbkUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUMsRUFBRSxPQUFPLEVBQUUsRUFBRTtnQkFDL0MsSUFBQSxhQUFNLEVBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDN0IsTUFBTSxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQ3hDLEVBQUUsVUFBVSxDQUFDO1lBQ2YsQ0FBQyxDQUFDLENBQUM7WUFFSCxNQUFNLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUU7Z0JBQ3RCLElBQUEsYUFBTSxFQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQy9CLElBQUksRUFBRSxDQUFDO1lBQ1QsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLFNBQVMsRUFBRSxHQUFHLEVBQUU7UUFDdkIsTUFBTSxZQUFZLEdBQUcsR0FBRyxFQUFFO1lBQ3hCLE1BQU0sTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLFVBQVUsRUFBRSxNQUFNLENBQUMsTUFBTSxDQUNqRCxFQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsTUFBTSxFQUFDLEVBQ3ZCLEdBQUcsQ0FBQyxLQUFLLENBQUMsaUNBQWlDLENBQUMsQ0FDN0MsQ0FBQyxDQUFDO1lBRUgsb0JBQUUsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxXQUFXLEVBQUUsb0JBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ3RELE9BQU8sTUFBTSxDQUFDO1FBQ2hCLENBQUMsQ0FBQztRQUVGLEVBQUUsQ0FBQyx3QkFBd0IsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFO1lBQ3BDLE1BQU0sTUFBTSxHQUFHLFlBQVksRUFBRSxDQUFDO1lBQzlCLE1BQU0sS0FBSyxHQUFHLEVBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFDLENBQUM7WUFFN0Msb0JBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsV0FBVyxFQUFFLEVBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDLEVBQUUsb0JBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQztpQkFDaEYsWUFBWSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztZQUU3QixNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQyxFQUFFLENBQUMsR0FBRyxFQUFFLE1BQU0sRUFBRSxFQUFFO2dCQUNoRSxJQUFBLGFBQU0sRUFBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQztnQkFDdkIsSUFBQSxhQUFNLEVBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDN0IsSUFBSSxFQUFFLENBQUM7WUFDVCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyJ9