'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = void 0;
const restify_1 = __importDefault(require("restify"));
const logger = require('./logger');
const config = require('../config');
const matchSecret = (obj, prop) => {
    const has = obj && obj[prop] && Object.hasOwnProperty.call(obj[prop], 'secret');
    const match = has && (typeof obj[prop].secret === 'string')
        && (obj[prop].secret.length > 0) && (obj[prop].secret === config.secret);
    if (has)
        delete obj[prop].secret;
    return match;
};
const shouldLogRequest = (req) => req.url.indexOf(`${config.http.prefix}/ping/_health_check`) !== 0;
const shouldLogResponse = (res) => (res && res.statusCode >= 500);
const filteredLogger = (errorsOnly, logger) => (req, res, next) => {
    const logError = errorsOnly && shouldLogResponse(res);
    const logInfo = !errorsOnly && (shouldLogRequest(req) || shouldLogResponse(res));
    if (logError || logInfo)
        logger(req, res);
    if (next && typeof next === 'function')
        next();
};
const createServer = () => {
    logger.info({ env: process.env }, 'environment');
    const server = restify_1.default.createServer({
        handleUncaughtExceptions: true,
        log: logger
    });
    const requestLogger = filteredLogger(false, (req) => req.log.info({ req_id: req.id() }, `${req.method} ${req.url}`));
    server.use(requestLogger);
    server.use(restify_1.default.queryParser());
    server.use(restify_1.default.bodyParser());
    // Audit requests
    server.on('after', filteredLogger(process.env.NODE_ENV === 'production', restify_1.default.auditLogger({ log: logger /*, body: true*/ })));
    // Automatically add a request-id to the response
    function setRequestId(req, res, next) {
        req.log = req.log.child({ req_id: req.id() });
        res.setHeader('X-Request-Id', req.id());
        return next();
    }
    server.use(setRequestId);
    // Send audit statistics
    const sendAuditStats = require('./send-audit-stats');
    server.on('after', sendAuditStats);
    // Init object to dump our stuff into.
    server.use((req, res, next) => {
        req['ganomede'] = {
            secretMatches: matchSecret(req, 'body') || matchSecret(req, 'query')
        };
        next();
    });
    return server;
};
exports.createServer = createServer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3NlcnZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7Ozs7OztBQUViLHNEQUE4QjtBQUM5QixNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDbkMsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBRXBDLE1BQU0sV0FBVyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFO0lBQ2hDLE1BQU0sR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ2hGLE1BQU0sS0FBSyxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sS0FBSyxRQUFRLENBQUM7V0FDdEQsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEtBQUssTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBRTNFLElBQUksR0FBRztRQUNMLE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQztJQUUxQixPQUFPLEtBQUssQ0FBQztBQUNmLENBQUMsQ0FBQztBQUVGLE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUMvQixHQUFHLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUVwRSxNQUFNLGlCQUFpQixHQUFHLENBQUMsR0FBRyxFQUFFLEVB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