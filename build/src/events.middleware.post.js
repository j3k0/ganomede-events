'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const restify_1 = __importDefault(require("restify"));
const { parsePostParams } = require('./parse-http-params');
const createMiddleware = ({ poll = require('./poll'), log = require('./logger'), store }) => (req, res, next) => {
    const params = parsePostParams(req.body);
    if (params instanceof Error)
        return next(new restify_1.default.InvalidContentError(params.message));
    const { channel, event } = params;
    store.addEvent(channel, event, (err, event) => {
        if (err)
            return next(err);
        res.json(event);
        next();
        // notify poll listeners of the new event (in background)
        poll.emit(channel, event.id, (err) => {
            // ignore success, log errors
            if (err)
                log.error(err, 'poll.trigger failed');
        });
    });
};
module.exports = { createMiddleware };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnRzLm1pZGRsZXdhcmUucG9zdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ldmVudHMubWlkZGxld2FyZS5wb3N0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7Ozs7QUFFYixzREFBOEI7QUFDOUIsTUFBTSxFQUFDLGVBQWUsRUFBQyxHQUFHLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO0FBRXpELE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxFQUN4QixJQUFJLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUN4QixHQUFHLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxFQUN6QixLQUFLLEVBQ04sRUFBRSxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFO0lBQ3ZCLE1BQU0sTUFBTSxHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDekMsSUFBSSxNQUFNLFlBQVksS0FBSztRQUN6QixPQUFPLElBQUksQ0FBQyxJQUFJLGlCQUFPLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFFL0QsTUFBTSxFQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUMsR0FBRyxNQUFNLENBQUM7SUFFaEMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxFQUFFO1FBRTVDLElBQUksR0FBRztZQUNMLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRW5CLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDaEIsSUFBSSxFQUFFLENBQUM7UUFFUCx5REFBeUQ7UUFDekQsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLEVBQUUsRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFO1lBRW5DLDZCQUE2QjtZQUM3QixJQUFJLEdBQUc7Z0JBQ0wsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUscUJBQXFCLENBQUMsQ0FBQztRQUMxQyxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDO0FBRUYsTUFBTSxDQUFDLE9BQU8sR0FBRyxFQUFDLGdCQUFnQixFQUFDLENBQUMifQ==