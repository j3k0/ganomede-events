'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsClient = void 0;
const BaseClient = require('ganomede-base-client');
class EventsClient extends BaseClient {
    constructor({ protocol, hostname, port, pathnamePrefix, clientId, secret, agent }) {
        super(`${protocol}://${hostname}:${port}${pathnamePrefix}`, { agent });
        this.clientId = clientId;
        this.secret = secret;
    }
    getEvents(cursor, callback) {
        const qs = Object.assign(cursor.toQuery(), {
            clientId: this.clientId,
            secret: this.secret
        });
        this.apiCall({ method: 'get', path: '/events', qs }, callback);
    }
    sendEvent(channel, event, callback) {
        const body = Object.assign({
            clientId: this.clientId,
            secret: this.secret,
            channel
        }, event);
        this.apiCall({ method: 'post', path: '/events', body }, callback);
    }
}
exports.EventsClient = EventsClient;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRXZlbnRzQ2xpZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2NsaWVudC9FdmVudHNDbGllbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7QUFFYixNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsc0JBQXNCLENBQUMsQ0FBQztBQUVuRCxNQUFhLFlBQWEsU0FBUSxVQUFVO0lBQzFDLFlBQWEsRUFBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUM7UUFDOUUsS0FBSyxDQUFDLEdBQUcsUUFBUSxNQUFNLFFBQVEsSUFBSSxJQUFJLEdBQUcsY0FBYyxFQUFFLEVBQUUsRUFBQyxLQUFLLEVBQUMsQ0FBQyxDQUFDO1FBQ3JFLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO0lBQ3ZCLENBQUM7SUFFRCxTQUFTLENBQUUsTUFBTSxFQUFFLFFBQVE7UUFDekIsTUFBTSxFQUFFLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLEVBQUU7WUFDekMsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRO1lBQ3ZCLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTTtTQUNwQixDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEVBQUUsRUFBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQy9ELENBQUM7SUFFRCxTQUFTLENBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxRQUFRO1FBQ2pDLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7WUFDekIsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRO1lBQ3ZCLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTTtZQUNuQixPQUFPO1NBQ1IsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUVWLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDbEUsQ0FBQztDQUNGO0FBekJELG9DQXlCQyJ9