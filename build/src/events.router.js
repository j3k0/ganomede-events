'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const async_1 = __importDefault(require("async"));
const { requireSecret } = require('./middlewares');
const eventsStore = require('./events.store');
const redisStore = require('./redis.store');
const redisPubSub = require('./redis.pubsub');
const { createPoll } = require('./poll');
const router = (prefix, server, redisClient) => {
    const itemsStore = redisStore.createStore({ redisClient });
    const store = eventsStore.createStore({ itemsStore });
    const redisPubClient = redisClient.duplicate();
    const redisSubClient = redisClient.duplicate();
    const pubsub = redisPubSub.createPubSub({
        redisPubClient, redisSubClient
    });
    const poll = createPoll({ pubsub });
    const getEvents = require('./events.middleware.get')
        .createMiddleware({ store, poll });
    const postEvent = require('./events.middleware.post')
        .createMiddleware({ store, poll });
    server.post(`${prefix}/events`, requireSecret, postEvent);
    server.get(`${prefix}/events`, requireSecret, getEvents);
    return {
        close: (cb) => {
            async_1.default.parallel([
                (cb) => redisPubClient.quit(cb),
                (cb) => redisSubClient.quit(cb)
            ], cb);
        }
    };
};
module.exports = router;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnRzLnJvdXRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ldmVudHMucm91dGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7Ozs7QUFFYixrREFBMEI7QUFDMUIsTUFBTSxFQUFDLGFBQWEsRUFBQyxHQUFHLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQztBQUNqRCxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUM5QyxNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUM7QUFDNUMsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUM7QUFDOUMsTUFBTSxFQUFDLFVBQVUsRUFBQyxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUV2QyxNQUFNLE1BQU0sR0FBRyxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFLEVBQUU7SUFFN0MsTUFBTSxVQUFVLEdBQUcsVUFBVSxDQUFDLFdBQVcsQ0FBQyxFQUFDLFdBQVcsRUFBQyxDQUFDLENBQUM7SUFDekQsTUFBTSxLQUFLLEdBQUcsV0FBVyxDQUFDLFdBQVcsQ0FBQyxFQUFDLFVBQVUsRUFBQyxDQUFDLENBQUM7SUFDcEQsTUFBTSxjQUFjLEdBQUcsV0FBVyxDQUFDLFNBQVMsRUFBRSxDQUFDO0lBQy9DLE1BQU0sY0FBYyxHQUFHLFdBQVcsQ0FBQyxTQUFTLEVBQUUsQ0FBQztJQUMvQyxNQUFNLE1BQU0sR0FBRyxXQUFXLENBQUMsWUFBWSxDQUFDO1FBQ3RDLGNBQWMsRUFBRSxjQUFjO0tBQy9CLENBQUMsQ0FBQztJQUNILE1BQU0sSUFBSSxHQUFHLFVBQVUsQ0FBQyxFQUFDLE1BQU0sRUFBQyxDQUFDLENBQUM7SUFFbEMsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLHlCQUF5QixDQUFDO1NBQ2pELGdCQUFnQixDQUFDLEVBQUMsS0FBSyxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7SUFDbkMsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLDBCQUEwQixDQUFDO1NBQ2xELGdCQUFnQixDQUFDLEVBQUMsS0FBSyxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7SUFFbkMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLE1BQU0sU0FBUyxFQUM1QixhQUFhLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDNUIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sU0FBUyxFQUMzQixhQUFhLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFFNUIsT0FBTztRQUNMLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFO1lBQ1osZUFBSyxDQUFDLFFBQVEsQ0FBQztnQkFDYixDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQy9CLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQzthQUNoQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ1QsQ0FBQztLQUNGLENBQUM7QUFDSixDQUFDLENBQUM7QUFFRixNQUFNLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyJ9