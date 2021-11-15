'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testableWhen = exports.prepareRedisClient = void 0;
const testdouble_1 = __importDefault(require("testdouble"));
const redis_1 = __importDefault(require("redis"));
const config_1 = require("../config");
testdouble_1.default['print'] = (what) => {
    const message = testdouble_1.default.explain(what).description;
    console.log('%s', message); // eslint-disable-line no-console
};
//global.td = td;
//global.expect = expect;
// creates and check a redisClient according to config parameters.
//  - then callback(redisClient)
//  - redisClient will be null if it can't be joined
const prepareRedisClient = (cb) => (done) => {
    const client = redis_1.default.createClient({
        port: config_1.config.redis.port,
        host: config_1.config.redis.host,
        retry_strategy: (options) => new Error('skip-test')
    });
    client.flushdb(function (err) {
        // Connection to redis failed, skipping integration tests.
        if (err && err['origin'] && err['origin'].message === 'skip-test')
            cb(null);
        else
            cb(client);
        done();
    });
};
exports.prepareRedisClient = prepareRedisClient;
// skip a test if isTestRunnable function returns falsy
const testableWhen = (isTestRunnable, test) => {
    // no arrow function here:
    // https://github.com/mochajs/mochajs.github.io/pull/14/files
    let that = this;
    return function (done) {
        if (isTestRunnable())
            test(done);
        else
            that.skip();
    };
};
exports.testableWhen = testableWhen;
afterEach(() => testdouble_1.default.reset());
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVscGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vdGVzdHMvaGVscGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7Ozs7O0FBRWIsNERBQTRCO0FBRTVCLGtEQUEwQjtBQUMxQixzQ0FBaUM7QUFFakMsb0JBQUUsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxFQUFFO0lBQ3JCLE1BQU0sT0FBTyxHQUFHLG9CQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLFdBQVcsQ0FBQztJQUM3QyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLGlDQUFpQztBQUMvRCxDQUFDLENBQUM7QUFFRixpQkFBaUI7QUFDakIseUJBQXlCO0FBRXpCLGtFQUFrRTtBQUNsRSxnQ0FBZ0M7QUFDaEMsb0RBQW9EO0FBQzdDLE1BQU0sa0JBQWtCLEdBQUcsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUN2QyxDQUFDLElBQUksRUFBRSxFQUFFO0lBQ1AsTUFBTSxNQUFNLEdBQUcsZUFBSyxDQUFDLFlBQVksQ0FBQztRQUNoQyxJQUFJLEVBQUUsZUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJO1FBQ3ZCLElBQUksRUFBRSxlQUFNLENBQUMsS0FBSyxDQUFDLElBQUk7UUFDdkIsY0FBYyxFQUFFLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FDMUIsSUFBSSxLQUFLLENBQUMsV0FBVyxDQUFDO0tBQ3pCLENBQUMsQ0FBQztJQUNILE1BQU0sQ0FBQyxPQUFPLENBQUMsVUFBVSxHQUFHO1FBQzFCLDBEQUEwRDtRQUMxRCxJQUFJLEdBQUcsSUFBSSxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLE9BQU8sS0FBSyxXQUFXO1lBQy9ELEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQzs7WUFFVCxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDYixJQUFJLEVBQUUsQ0FBQztJQUNULENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDO0FBaEJTLFFBQUEsa0JBQWtCLHNCQWdCM0I7QUFFSix1REFBdUQ7QUFDaEQsTUFBTSxZQUFZLEdBQUcsQ0FBQyxjQUFjLEVBQUUsSUFBSSxFQUFFLEVBQUU7SUFDbkQsMEJBQTBCO0lBQzFCLDZEQUE2RDtJQUM3RCxJQUFJLElBQUksR0FBRyxJQUFJLENBQUM7SUFDaEIsT0FBTyxVQUFVLElBQUk7UUFDbkIsSUFBSSxjQUFjLEVBQUU7WUFDbEIsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDOztZQUVWLElBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUN6QixDQUFDLENBQUM7QUFDSixDQUFDLENBQUM7QUFWVyxRQUFBLFlBQVksZ0JBVXZCO0FBRUYsU0FBUyxDQUFDLEdBQUcsRUFBRSxDQUFDLG9CQUFFLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyJ9