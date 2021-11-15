'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const testdouble_1 = __importDefault(require("testdouble"));
const Cursor = require('../../src/client/Cursor');
const EventsClient = require('../../src/client/EventsClient');
describe('EventsClient', () => {
    const createClient = () => new EventsClient({
        protocol: 'http',
        hostname: 'example.com',
        port: 80,
        pathnamePrefix: '/events/v1',
        clientId: 'test',
        secret: 'api_secret'
    });
    it('#getEvents() request events', (done) => {
        const client = createClient();
        const cursor = new Cursor('channel', { limit: 10 });
        const validPath = testdouble_1.default.matchers.contains({
            path: '/events/v1/events?channel=channel&limit=10&clientId=test&secret=api_secret'
        });
        testdouble_1.default.replace(client.api, 'get', testdouble_1.default.function());
        testdouble_1.default.when(client.api.get(validPath, testdouble_1.default.callback))
            .thenCallback(null, {}, {}, { ok: true });
        client.getEvents(cursor, (err, events) => {
            (0, chai_1.expect)(err).to.be.null;
            (0, chai_1.expect)(events).to.eql({ ok: true });
            done();
        });
    });
    describe('#post()', () => {
        const channel = 'some-channel-with-events';
        const from = 'service/v1';
        const type = 'event-type';
        const data = { something: true };
        const reply = { id: 1, timestamp: Date.now() };
        it('sends events', (done) => {
            const client = createClient();
            const expectedPath = testdouble_1.default.matchers.contains({ path: '/events/v1/events' });
            const expectedBody = {
                secret: 'api_secret',
                clientId: 'test',
                channel,
                from: 'service/v1',
                type: 'event-type',
                data: { something: true }
            };
            testdouble_1.default.replace(client.api, 'post', testdouble_1.default.function());
            testdouble_1.default.when(client.api.post(expectedPath, expectedBody, testdouble_1.default.callback))
                .thenCallback(null, {}, {}, reply);
            client.sendEvent(channel, { from, type, data }, (err, header) => {
                (0, chai_1.expect)(err).to.be.null;
                (0, chai_1.expect)(header).to.eql(reply);
                done();
            });
        });
        it('translates `event.req_id` to X- header', (done) => {
            const client = createClient();
            const event = { from, type, req_id: 'deadbeef' };
            const expectedOptions = {
                path: '/events/v1/events',
                headers: { 'x-request-id': 'deadbeef' }
            };
            testdouble_1.default.replace(client.api, 'post', testdouble_1.default.function());
            testdouble_1.default.when(client.api.post(expectedOptions, testdouble_1.default.matchers.isA(Object), testdouble_1.default.callback))
                .thenCallback(null, {}, {}, reply);
            client.sendEvent(channel, event, (err, header) => {
                (0, chai_1.expect)(err).to.be.null;
                (0, chai_1.expect)(header).to.eql(reply);
                done();
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRXZlbnRzQ2xpZW50LnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi90ZXN0cy9DbGllbnQvRXZlbnRzQ2xpZW50LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7OztBQUViLCtCQUE0QjtBQUM1Qiw0REFBNEI7QUFFNUIsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLHlCQUF5QixDQUFDLENBQUM7QUFDbEQsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLCtCQUErQixDQUFDLENBQUM7QUFFOUQsUUFBUSxDQUFDLGNBQWMsRUFBRSxHQUFHLEVBQUU7SUFDNUIsTUFBTSxZQUFZLEdBQUcsR0FBRyxFQUFFLENBQUMsSUFBSSxZQUFZLENBQUM7UUFDMUMsUUFBUSxFQUFFLE1BQU07UUFDaEIsUUFBUSxFQUFFLGFBQWE7UUFDdkIsSUFBSSxFQUFFLEVBQUU7UUFDUixjQUFjLEVBQUUsWUFBWTtRQUM1QixRQUFRLEVBQUUsTUFBTTtRQUNoQixNQUFNLEVBQUUsWUFBWTtLQUNyQixDQUFDLENBQUM7SUFFSCxFQUFFLENBQUMsNkJBQTZCLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRTtRQUN6QyxNQUFNLE1BQU0sR0FBRyxZQUFZLEVBQUUsQ0FBQztRQUM5QixNQUFNLE1BQU0sR0FBRyxJQUFJLE1BQU0sQ0FBQyxTQUFTLEVBQUUsRUFBQyxLQUFLLEVBQUUsRUFBRSxFQUFDLENBQUMsQ0FBQztRQUNsRCxNQUFNLFNBQVMsR0FBRyxvQkFBRSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUM7WUFDckMsSUFBSSxFQUFFLDRFQUE0RTtTQUNuRixDQUFDLENBQUM7UUFFSCxvQkFBRSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxvQkFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7UUFFN0Msb0JBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFH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