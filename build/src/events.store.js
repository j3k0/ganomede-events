'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStore = exports.EventsStore = void 0;
const async_1 = __importDefault(require("async"));
const logger = require('./logger');
const lastFetchedKey = (clientId, channel) => `last-fetched:${clientId}:${channel}`;
class EventsStore {
    constructor(itemsStore) {
        this.items = itemsStore;
    }
    addEvent(channel, eventArg, callback) {
        async_1.default.waterfall([
            (cb) => this.items.nextIndex(channel, cb),
            (id, cb) => {
                const event = Object.assign({
                    id,
                    timestamp: Date.now(),
                }, eventArg);
                this.items.addItem(channel, event, (err) => {
                    return err
                        ? cb(err)
                        : cb(null, event);
                });
            }
        ], callback);
    }
    _load(channel, after, limit, callback) {
        // Try updating last fetched index.
        // Start loading stuff.
        this.items.loadItems(channel, after, limit, callback);
    }
    _loadWithLastFetched(clientId, channel, limit, callback) {
        async_1.default.waterfall([
            (cb) => this.items.getIndex(lastFetchedKey(clientId, channel), cb),
            (after, cb) => this._load(channel, after, limit, cb)
        ], callback);
    }
    loadLatestItems(channel, limit, callback) {
        this.items.loadLatestEvents(channel, limit, callback);
    }
    loadEvents(channel, { clientId, after, limit, afterExplicitlySet }, callback) {
        if (afterExplicitlySet) {
            // In addition to loading items, treat this request as an ACK
            // that client processed all the messages with id up to `after`
            // and update last-fetched to be that.
            const key = lastFetchedKey(clientId, channel);
            this.items.setIndex(key, after, (err) => {
                if (err)
                    logger.error('Failed to update "%s"', key, err);
            });
            return this._load(channel, after, limit, callback);
        }
        this._loadWithLastFetched(clientId, channel, limit, callback);
    }
}
exports.EventsStore = EventsStore;
const createStore = ({ itemsStore }) => new EventsStore(itemsStore);
exports.createStore = createStore;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnRzLnN0b3JlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V2ZW50cy5zdG9yZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7Ozs7OztBQUViLGtEQUEwQjtBQUMxQixNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7QUFFbkMsTUFBTSxjQUFjLEdBQUcsQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLEVBQUUsQ0FBQyxnQkFBZ0IsUUFBUSxJQUFJLE9BQU8sRUFBRSxDQUFDO0FBRXBGLE1BQWEsV0FBVztJQUd0QixZQUFhLFVBQVU7UUFDckIsSUFBSSxDQUFDLEtBQUssR0FBRyxVQUFVLENBQUM7SUFDMUIsQ0FBQztJQUVELFFBQVEsQ0FBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLFFBQVE7UUFDbkMsZUFBSyxDQUFDLFNBQVMsQ0FBQztZQUNkLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDO1lBQ3pDLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFO2dCQUNULE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7b0JBQzFCLEVBQUU7b0JBQ0YsU0FBUyxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUU7aUJBQ3RCLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBRWIsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFO29CQUN6QyxPQUFPLEdBQUc7d0JBQ1IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7d0JBQ1QsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ3RCLENBQUMsQ0FBQyxDQUFDO1lBQ0wsQ0FBQztTQUNGLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDZixDQUFDO0lBRUQsS0FBSyxDQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLFFBQVE7UUFDcEMsbUNBQW1DO1FBR25DLHVCQUF1QjtRQUN2QixJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztJQUN4RCxDQUFDO0lBRUQsb0JBQW9CLENBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsUUFBUTtRQUN0RCxlQUFLLENBQUMsU0FBUyxDQUFDO1lBQ2QsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ2xFLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxFQUFFLENBQUM7U0FDckQsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUNmLENBQUM7SUFFRCxlQUFlLENBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxRQUFRO1FBQ3ZDLElBQUksQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztJQUN4RCxDQUFDO0lBRUQsVUFBVSxDQUFFLE9BQU8sRUFBRSxFQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLGtCQUFrQixFQUE2RSxFQUFFLFFBQVE7UUFDckosSUFBSSxrQkFBa0IsRUFBRTtZQUN0Qiw2REFBNkQ7WUFDN0QsK0RBQStEO1lBQy9ELHNDQUFzQztZQUN0QyxNQUFNLEdBQUcsR0FBRyxjQUFjLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQzlDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRTtnQkFDdEMsSUFBSSxHQUFHO29CQUNMLE1BQU0sQ0FBQyxLQUFLLENBQUMsdUJBQXVCLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ3BELENBQUMsQ0FBQyxDQUFDO1lBQ0gsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1NBQ3BEO1FBRUQsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ2hFLENBQUM7Q0FDRjtBQTNERCxrQ0EyREM7QUFFTSxNQUFNLFdBQVcsR0FBRyxDQUFDLEVBQUMsVUFBVSxFQUFDLEVBQUUsRUFBRSxDQUFDLElBQUksV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQTVELFFBQUEsV0FBVyxlQUFpRCJ9