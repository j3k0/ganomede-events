'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const async_1 = __importDefault(require("async"));
const cluster = require('cluster');
const redis = require('redis');
const restify = require('restify');
const curtain = require('curtain-down');
const config = require('../config');
const about = require('./about.router');
const events = require('./events.router');
const latest = require('./latest.router');
const ping = require('./ping.router');
const createServer = require('./server');
const logger = require('./logger');
const master = () => {
    let running = true;
    curtain.on(() => {
        if (!running) {
            logger.info('aaaaaarghhhhh...');
            return process.exit(1);
        }
        logger.info('master stopping…');
        running = false;
        // Forcefully exit if workers hang for too long
        setTimeout(process.exit.bind(process, 0), 30e3).unref();
    });
    logger.info(config, 'parsed config');
    cluster.fork();
    cluster.on('disconnect', (worker) => {
        logger.info('worker disconnected');
        if (running) {
            logger.error('restarting…');
            cluster.fork();
        }
    });
};
const child = () => {
    const server = createServer();
    // Clients
    const redisClient = redis.createClient(config.redis.port, config.redis.host);
    const eventsRouter = events(config.http.prefix, server, redisClient);
    const latestRouter = latest(config.http.prefix, server, redisClient);
    about(config.http.prefix, server);
    ping(config.http.prefix, server);
    curtain.on(() => {
        logger.info('worker stopping…');
        async_1.default.parallel([
            (cb) => redisClient.quit(cb),
            (cb) => server.close(cb),
            (cb) => eventsRouter.close(cb),
            (cb) => latestRouter.close(cb),
        ], () => cluster.worker.disconnect());
    });
    server.listen(config.http.port, config.http.host, () => {
        const { port, family, address } = server.address();
        logger.info('ready at %s:%d (%s)', address, port, family);
    });
    // Handle uncaughtException, kill the worker.
    server.on('uncaughtException', (req, res, route, err) => {
        logger.error(err);
        // Note: we're in dangerous territory!
        // By definition, something unexpected occurred,
        // which we probably didn't want.
        // Anything can happen now! Be very careful!
        try {
            // make sure we close down within 30 seconds
            setTimeout(() => process.exit(1), 30e3);
            // stop taking new requests
            server.close();
            // Let the master know we're dead.  This will trigger a
            // 'disconnect' in the cluster master, and then it will fork
            // a new worker.
            cluster.worker.disconnect();
            const message = err.message || 'unexpected error';
            res.send(new restify.InternalError(message));
        }
        catch (err2) {
            logger.error(err2, 'error sending 500!');
        }
    });
};
module.exports = () => {
    return cluster.isMaster
        ? master()
        : child();
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7Ozs7QUFFYixrREFBMEI7QUFDMUIsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ25DLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUMvQixNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDbkMsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQ3hDLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUNwQyxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUN4QyxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUMxQyxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUMxQyxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUM7QUFDdEMsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ3pDLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUVuQyxNQUFNLE1BQU0sR0FBRyxHQUFHLEVBQUU7SUFDbEIsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDO0lBRW5CLE9BQU8sQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFO1FBQ2QsSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUNaLE1BQU0sQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUNoQyxPQUFPLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDeEI7UUFFRCxNQUFNLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENB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