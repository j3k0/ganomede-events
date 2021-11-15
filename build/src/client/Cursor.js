'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cursor = void 0;
const util = require('util');
const lodash = require('lodash');
class Cursor {
    constructor(channel, { after = null, limit = null } = {}) {
        this.channel = '';
        if (typeof channel !== 'string' || (channel.length === 0)) {
            const message = util.format('new Cursor() requires channel to be non-empty string, got %j (%s)', channel, typeof channel);
            throw new Error(message);
        }
        this.channel = channel;
        this.after = after;
        this.limit = limit;
    }
    advance(events) {
        const newestEvent = Array.isArray(events) && (events.length > 0)
            ? lodash.maxBy(events, event => event.id)
            : undefined;
        return newestEvent
            ? new Cursor(this.channel, { limit: this.limit, after: newestEvent.id })
            : this;
    }
    toQuery() {
        const qs = { channel: this.channel };
        if (this.after !== null)
            qs['after'] = this.after;
        if (this.limit !== null)
            qs['limit'] = this.limit;
        return qs;
    }
}
exports.Cursor = Cursor;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ3Vyc29yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2NsaWVudC9DdXJzb3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7QUFFYixNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDN0IsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBRWpDLE1BQWEsTUFBTTtJQUlqQixZQUFhLE9BQWdCLEVBQUUsRUFBQyxLQUFLLEdBQUcsSUFBSSxFQUFFLEtBQUssR0FBRyxJQUFJLEVBQUMsR0FBRyxFQUFFO1FBSGhFLFlBQU8sR0FBVyxFQUFFLENBQUM7UUFJbkIsSUFBSSxPQUFPLE9BQU8sS0FBSyxRQUFRLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxFQUFFO1lBQ3pELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQ3pCLG1FQUFtRSxFQUNuRSxPQUFPLEVBQ1AsT0FBTyxPQUFPLENBQ2YsQ0FBQztZQUVGLE1BQU0sSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDMUI7UUFFRCxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUN2QixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztRQUNuQixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztJQUNyQixDQUFDO0lBRUQsT0FBTyxDQUFFLE1BQU07UUFDYixNQUFNLFdBQVcsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7WUFDOUQsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUN6QyxDQUFDLENBQUMsU0FBUyxDQUFDO1FBRWQsT0FBTyxXQUFXO1lBQ2hCLENBQUMsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEVBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLFdBQVcsQ0FBQyxFQUFFLEVBQUMsQ0FBQztZQUN0RSxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQ1gsQ0FBQztJQUVELE9BQU87UUFDTCxNQUFNLEVBQUUsR0FBRyxFQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFDLENBQUM7UUFFbkMsSUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLElBQUk7WUFDckIsRUFBRSxDQUFDLE9BQU8sQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7UUFFM0IsSUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLElBQUk7WUFDckIsRUFBRSxDQUFDLE9BQU8sQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7UUFFM0IsT0FBTyxFQUFFLENBQUM7SUFDWixDQUFDO0NBQ0Y7QUF6Q0Qsd0JBeUNDIn0=