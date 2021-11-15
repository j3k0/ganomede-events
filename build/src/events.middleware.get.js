'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// restify middleware that loads and outputs events
// from a given channel
//
// GET parameters:
//  - after: event id (string)
//           only output events newer than this
//           (can be undefined for all events)
//  - channel: string
//             channel to load events from
//
// Reponds with a JSON array of events (see README.md)
//
const restify_1 = __importDefault(require("restify"));
const { parseGetParams } = require('./parse-http-params');
const pollForEvents = require('./poll-for-events');
const createMiddleware = ({ poll = require('./poll'), log = require('./logger'), config = require('../config'), store }) => (req, res, next) => {
    const params = parseGetParams(req.params);
    if (params instanceof Error)
        return next(new restify_1.default.InvalidContentError(params.message));
    pollForEvents(store, poll, params, (err, events) => {
        if (err) {
            log.error(err);
            return next(err);
        }
        res.json(events);
        next();
    });
};
module.exports = { createMiddleware };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnRzLm1pZGRsZXdhcmUuZ2V0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V2ZW50cy5taWRkbGV3YXJlLmdldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7Ozs7O0FBRWIsbURBQW1EO0FBQ25ELHVCQUF1QjtBQUN2QixFQUFFO0FBQ0Ysa0JBQWtCO0FBQ2xCLDhCQUE4QjtBQUM5QiwrQ0FBK0M7QUFDL0MsOENBQThDO0FBQzlDLHFCQUFxQjtBQUNyQiwwQ0FBMEM7QUFDMUMsRUFBRTtBQUNGLHNEQUFzRDtBQUN0RCxFQUFFO0FBRUYsc0RBQThCO0FBQzlCLE1BQU0sRUFBQyxjQUFjLEVBQUMsR0FBRyxPQUFPLENBQUMscUJBQXFCLENBQUMsQ0FBQztBQUN4RCxNQUFNLGFBQWEsR0FBRyxPQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQztBQUVuRCxNQUFNLGdCQUFnQixHQUFHLENBQUMsRUFDeEIsSUFBSSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFDeEIsR0FBRyxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFDekIsTUFBTSxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsRUFDN0IsS0FBSyxFQUNOLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsRUFBRTtJQUN2QixNQUFNLE1BQU0sR0FBRyxjQUFjLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzFDLElBQUksTUFBTSxZQUFZLEtBQUs7UUFDekIsT0FBTyxJQUFJLENBQUMsSUFBSSxpQkFBTyxDQUFDLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBRS9ELGFBQWEsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxDQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUUsRUFBRTtRQUNqRCxJQUFJLEdBQUcsRUFBRTtZQUNQLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDZixPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUNsQjtRQUVELEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDakIsSUFBSSxFQUFFLENBQUM7SUFDVCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQztBQUVGLE1BQU0sQ0FBQyxPQUFPLEdBQUcsRUFBQyxnQkFBZ0IsRUFBQyxDQUFDIn0=