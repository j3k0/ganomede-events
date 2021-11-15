'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const restify_1 = __importDefault(require("restify"));
module.exports = (store, poll, params, callback) => {
    const { after, channel } = params;
    const loadEvents = (cb) => store.loadEvents(channel, params, cb);
    // Process the outcome of store.loadEvents,
    // returns true iff the middleware's job is over (next was called).
    const processLoad = (err, events, minimalEventsCount = 0) => {
        if (err) {
            callback(err);
            return true;
        }
        if (events.length >= minimalEventsCount) {
            callback(null, events);
            return true;
        }
        return false;
    };
    // Process the outcome of poll.listen
    //  - when a new message is received,
    //         -> reload and output events.
    //  - when no new messages are received,
    //         -> output an empty array
    const processPoll = (err, message) => {
        if (err)
            return callback(new restify_1.default.InternalServerError('polling failed'));
        else {
            if (message > after)
                return loadEvents(processLoad);
            else
                return processLoad(null, []); // timeout is not an error but expected behavior
        }
    };
    const pollEvents = () => poll.listen(channel, processPoll);
    loadEvents((err, events) => (processLoad(err, events, 1) || pollEvents()));
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9sbC1mb3ItZXZlbnRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3BvbGwtZm9yLWV2ZW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7Ozs7O0FBRWIsc0RBQThCO0FBRTlCLE1BQU0sQ0FBQyxPQUFPLEdBQUcsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsRUFBRTtJQUNqRCxNQUFNLEVBQUMsS0FBSyxFQUFFLE9BQU8sRUFBQyxHQUFHLE1BQU0sQ0FBQztJQUVoQyxNQUFNLFVBQVUsR0FBRyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQ3hCLEtBQUssQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQztJQUV4QywyQ0FBMkM7SUFDM0MsbUVBQW1FO0lBQ25FLE1BQU0sV0FBVyxHQUFHLENBQUMsR0FBRyxFQUFFLE1BQU0sRUFBRSxrQkFBa0IsR0FBRyxDQUFDLEVBQUUsRUFBRTtRQUMxRCxJQUFJLEdBQUcsRUFBRTtZQUNQLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNkLE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFFRCxJQUFJLE1BQU0sQ0FBQyxNQUFNLElBQUksa0JBQWtCLEVBQUU7WUFDdkMsUUFBUSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztZQUN2QixPQUFPLElBQUksQ0FBQztTQUNiO1FBRUQsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDLENBQUM7SUFFRixxQ0FBcUM7SUFDckMscUNBQXFDO0lBQ3JDLHVDQUF1QztJQUN2Qyx3Q0FBd0M7SUFDeEMsbUNBQW1DO0lBQ25DLE1BQU0sV0FBVyxHQUFHLENBQUMsR0FBRyxFQUFFLE9BQU8sRUFBRSxFQUFFO1FBQ25DLElBQUksR0FBRztZQUNMLE9BQU8sUUFBUSxDQUFDLElBQUksaUJBQU8sQ0FBQyxtQkFBbUIsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7YUFDaEU7WUFDSCxJQUFJLE9BQU8sR0FBRyxLQUFLO2dCQUNqQixPQUFPLFVBQVUsQ0FBQyxXQUFXLENBQUMsQ0FBQzs7Z0JBRS9CLE9BQU8sV0FBVyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLGdEQUFnRDtTQUNqRjtJQUNILENBQUMsQ0FBQztJQUVGLE1BQU0sVUFBVSxHQUFHLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBRTNELFVBQVUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUUsRUFBRSxDQUN6QixDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQyxJQUFJLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUNuRCxDQUFDLENBQUMifQ==