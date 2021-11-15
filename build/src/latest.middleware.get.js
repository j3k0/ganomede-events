'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// restify middleware that loads and outputs latest events
// from a given channel
//
// GET parameters:
//  - channel: string
//             channel to load events from
//
// Reponds with a JSON array of events (see README.md)
//
const restify_1 = __importDefault(require("restify"));
const { parseLatestGetParams } = require('./parse-http-params');
const createMiddleware = ({ poll = require('./poll'), log = require('./logger'), config = require('../config'), store }) => (req, res, next) => {
    const params = parseLatestGetParams(req.params);
    if (params instanceof Error)
        return next(new restify_1.default.InvalidContentError(params.message));
    const { channel, limit } = params;
    store.loadLatestItems(channel, limit, (err, data) => {
        if (err)
            return next(err);
        res.json(data);
        next();
    });
};
module.exports = { createMiddleware };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGF0ZXN0Lm1pZGRsZXdhcmUuZ2V0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2xhdGVzdC5taWRkbGV3YXJlLmdldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7Ozs7O0FBRWIsMERBQTBEO0FBQzFELHVCQUF1QjtBQUN2QixFQUFFO0FBQ0Ysa0JBQWtCO0FBQ2xCLHFCQUFxQjtBQUNyQiwwQ0FBMEM7QUFDMUMsRUFBRTtBQUNGLHNEQUFzRDtBQUN0RCxFQUFFO0FBRUYsc0RBQThCO0FBQzlCLE1BQU0sRUFBQyxvQkFBb0IsRUFBQyxHQUFHLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO0FBRTlELE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxFQUN4QixJQUFJLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUN4QixHQUFHLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxFQUN6QixNQUFNLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxFQUM3QixLQUFLLEVBQ04sRUFBRSxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFO0lBQ3ZCLE1BQU0sTUFBTSxHQUFHLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNoRCxJQUFJLE1BQU0sWUFBWSxLQUFLO1FBQ3pCLE9BQU8sSUFBSSxDQUFDLElBQUksaUJBQU8sQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUUvRCxNQUFNLEVBQUMsT0FBTyxFQUFFLEtBQUssRUFBQyxHQUFHLE1BQU0sQ0FBQztJQUVoQyxLQUFLLENBQUMsZUFBZSxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLEVBQUU7UUFFbEQsSUFBSSxHQUFHO1lBQ0wsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFFbkIsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNmLElBQUksRUFBRSxDQUFDO0lBQ1QsQ0FBQyxDQUFDLENBQUM7QUFFTCxDQUFDLENBQUM7QUFFRixNQUFNLENBQUMsT0FBTyxHQUFHLEVBQUMsZ0JBQWdCLEVBQUMsQ0FBQyJ9