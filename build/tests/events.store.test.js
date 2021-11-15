'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_store_1 = require("../src/events.store");
const chai_1 = require("chai");
const testdouble_1 = __importDefault(require("testdouble"));
describe('events.store', () => {
    describe('#addEvent()', () => {
        const now = Date.now();
        let actualEvent;
        before((done) => {
            const itemsStore = testdouble_1.default.object(null); // (['nextIndex', 'addItem']);
            const subject = (0, events_store_1.createStore)({ itemsStore });
            const expectedHeader = testdouble_1.default.matchers.contains({
                id: 5,
                timestamp: now
            });
            testdouble_1.default.replace(Date, 'now', () => now);
            testdouble_1.default.when(itemsStore.nextIndex('channel', testdouble_1.default.callback))
                .thenCallback(null, 5);
            testdouble_1.default.when(itemsStore.addItem('channel', expectedHeader, testdouble_1.default.callback))
                .thenCallback(null);
            subject.addEvent('channel', { from: 'me', type: 'kind', data: {} }, (err, event) => {
                (0, chai_1.expect)(err).to.be.null;
                actualEvent = event;
                done();
            });
        });
        it('returns object', () => {
            (0, chai_1.expect)(actualEvent).to.be.ok;
            (0, chai_1.expect)(actualEvent).to.be.instanceof(Object);
        });
        it('fills in event ID based on store channel index', () => {
            (0, chai_1.expect)(actualEvent.id).to.equal(5);
        });
        it('fills in event timestamp', () => {
            (0, chai_1.expect)(actualEvent.timestamp).to.equal(now);
        });
    });
    describe('#loadEvents()', () => {
        it('updates last fetched index and loads items in case after is explicit', (done) => {
            const itemsStore = testdouble_1.default.object(null); // td.object(['setIndex', 'loadItems']);
            const subject = (0, events_store_1.createStore)({ itemsStore });
            testdouble_1.default.when(itemsStore.loadItems('channel', 5, 100, testdouble_1.default.callback))
                .thenCallback(null, [1, 2, 3]);
            subject.loadEvents('channel', { clientId: 'client', after: 5, limit: 100, afterExplicitlySet: true }, (err, events) => {
                (0, chai_1.expect)(err).to.be.null;
                (0, chai_1.expect)(events).to.eql([1, 2, 3]);
                testdouble_1.default.verify(itemsStore.setIndex('last-fetched:client:channel', 5, testdouble_1.default.matchers.isA(Function)));
                done();
            });
        });
        it('asks itemsStore for missing `after` with `clientId`', (done) => {
            const itemsStore = testdouble_1.default.object(null); // td.object(['getIndex', 'loadItems']);
            const subject = (0, events_store_1.createStore)({ itemsStore });
            testdouble_1.default.when(itemsStore.getIndex('last-fetched:client:channel', testdouble_1.default.callback))
                .thenCallback(null, 5);
            testdouble_1.default.when(itemsStore.loadItems('channel', 5, 99, testdouble_1.default.callback))
                .thenCallback(null, [1, 2, 3]);
            subject.loadEvents('channel', { clientId: 'client', limit: 99 }, (err, events) => {
                (0, chai_1.expect)(err).to.be.null;
                (0, chai_1.expect)(events).to.eql([1, 2, 3]);
                done();
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnRzLnN0b3JlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi90ZXN0cy9ldmVudHMuc3RvcmUudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7Ozs7O0FBRWIsc0RBQWdEO0FBRWhELCtCQUE0QjtBQUM1Qiw0REFBNEI7QUFFNUIsUUFBUSxDQUFDLGNBQWMsRUFBRSxHQUFHLEVBQUU7SUFDNUIsUUFBUSxDQUFDLGFBQWEsRUFBRSxHQUFHLEVBQUU7UUFDM0IsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ3ZCLElBQUksV0FBVyxDQUFDO1FBRWhCLE1BQU0sQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFO1lBQ2QsTUFBTSxVQUFVLEdBQUcsb0JBQUUsQ0FBQyxNQUFNLENBQWMsSUFBVyxDQUFDLENBQUMsQ0FBQSw4QkFBOEI7WUFDckYsTUFBTSxPQUFPLEdBQUcsSUFBQSwwQkFBVyxFQUFDLEVBQUMsVUFBVSxFQUFDLENBQUMsQ0FBQztZQUMxQyxNQUFNLGNBQWMsR0FBRyxvQkFBRSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUM7Z0JBQzFDLEVBQUUsRUFBRSxDQUFDO2dCQUNMLFNBQVMsRUFBRSxHQUFHO2FBQ2YsQ0FBQyxDQUFDO1lBRUgsb0JBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUVuQyxvQkFBRSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLFNBQVMsRUFBRSxvQkFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2lCQUNsRCxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRXpCLG9CQUFFLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLGNBQWMsRUFBRSxvQkFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2lCQUNo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