'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.latest = void 0;
const async_1 = __importDefault(require("async"));
const { requireSecret } = require('./middlewares');
const eventsStore = require('./events.store');
const redisStore = require('./redis.store');
const redisPubSub = require('./redis.pubsub');
const { createPoll } = require('./poll');
const latest = (prefix, server, redisClient) => {
    const itemsStore = redisStore.createStore({ redisClient });
    const store = eventsStore.createStore({ itemsStore });
    const redisPubClient = redisClient.duplicate();
    const redisSubClient = redisClient.duplicate();
    const pubsub = redisPubSub.createPubSub({
        redisPubClient, redisSubClient
    });
    const poll = createPoll({ pubsub });
    const getLatest = require('./latest.middleware.get')
        .createMiddleware({ store, poll });
    server.get('/latest', requireSecret, getLatest);
    server.get(`${prefix}/latest`, requireSecret, getLatest);
    return {
        close: (cb) => {
            async_1.default.parallel([
                (cb) => redisPubClient.quit(cb),
                (cb) => redisSubClient.quit(cb)
            ], cb);
        }
    };
};
exports.latest = latest;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGF0ZXN0LnJvdXRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9sYXRlc3Qucm91dGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7Ozs7O0FBR2Isa0RBQTBCO0FBQzFCLE1BQU0sRUFBQyxhQUFhLEVBQUMsR0FBRyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUM7QUFDakQsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUM7QUFDOUMsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDO0FBQzVDLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0FBQzlDLE1BQU0sRUFBQyxVQUFVLEVBQUMsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7QUFHaEMsTUFBTSxNQUFNLEdBQUcsQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRSxFQUFFO0lBR3BELE1BQU0sVUFBVSxHQUFHLFVBQVUsQ0FBQyxXQUFXLENBQUMsRUFBQyxXQUFXLEVBQUMsQ0FBQyxDQUFDO0lBQ3pELE1BQU0sS0FBSyxHQUFHLFdBQVcsQ0FBQyxXQUFXLENBQUMsRUFBQyxVQUFVLEVBQUMsQ0FBQyxDQUFDO0lBQ3BELE1BQU0sY0FBYyxHQUFHLFdBQVcsQ0FBQyxTQUFTLEVBQUUsQ0FBQztJQUMvQyxNQUFNLGNBQWMsR0FBRyxXQUFXLENBQUMsU0FBUyxFQUFFLENBQUM7SUFDL0MsTUFBTSxNQUFNLEdBQUcsV0FBVyxDQUFDLFlBQVksQ0FBQztRQUN0QyxjQUFjLEVBQUUsY0FBYztLQUMvQixDQUFDLENBQUM7SUFDSCxNQUFNLElBQUksR0FBRyxVQUFVLENBQUMsRUFBQyxNQUFNLEVBQUMsQ0FBQyxDQUFDO0lBRWxDLE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyx5QkFBeUIsQ0FBQztTQUNqRCxnQkFBZ0IsQ0FBQyxFQUFDLEtBQUssRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO0lBRW5DLE1BQU0sQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLGFBQWEsRUFBRSxTQUFTLENBQUMsQ0FBQztJQUNoRCxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxTQUFTLEVBQUUsYUFBYSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBRXpELE9BQU87UUFDTCxLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRTtZQUNaLGVBQUssQ0FBQyxRQUFRLENBQUM7Z0JBQ2IsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUMvQixDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7YUFDaEMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNULENBQUM7S0FDRixDQUFDO0FBQ0osQ0FBQyxDQUFDO0FBMUJXLFFBQUEsTUFBTSxVQTBCakIifQ==