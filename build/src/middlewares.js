'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = exports.requireSecret = void 0;
const lodash_1 = __importDefault(require("lodash"));
const restify = require('restify');
const { InvalidAuthTokenError, InvalidCredentialsError, sendHttpError } = require('./errors');
const logger = require('./logger');
const requireSecret = (req, res, next) => {
    return req.ganomede.secretMatches
        ? next()
        : sendHttpError(next, new InvalidCredentialsError());
};
exports.requireSecret = requireSecret;
const parseUserIdFromSecretToken = (secret, token) => {
    return secret && token && token.startsWith(secret) && (token.length > secret.length + 1)
        ? token.slice(secret.length + 1)
        : false;
};
const requireAuth = ({ authdbClient = null, secret = '', paramName = 'token' } = { authdbClient: null, secret: '', paramName: 'token' }) => (req, res, next) => {
    const token = lodash_1.default.get(req, `params.${paramName}`);
    if (!token)
        return sendHttpError(next, new InvalidAuthTokenError());
    const spoofed = secret && parseUserIdFromSecretToken(secret, token);
    if (spoofed) {
        req.ganomede.secretMatches = true;
        req.ganomede.userId = spoofed;
        return next();
    }
    authdbClient === null || authdbClient === void 0 ? void 0 : authdbClient.getAccount(token, (err, redisResult) => {
        if (err) {
            logger.error('authdbClient.getAccount("%j") failed', token, err);
            return sendHttpError(next, new restify.InternalServerError());
        }
        if (!redisResult)
            return sendHttpError(next, new InvalidCredentialsError());
        // Authdb already JSON.parsed redisResult for us,
        // but sometimes it is a string with user id,
        // and sometimes it is account object with {username, email, etc...}
        const userId = (typeof redisResult === 'string')
            ? redisResult
            : redisResult.username; // userId used to be username from profile
        if (!redisResult)
            return sendHttpError(next, new InvalidCredentialsError());
        req.ganomede.userId = userId;
        return next();
    });
};
exports.requireAuth = requireAuth;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlkZGxld2FyZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbWlkZGxld2FyZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7Ozs7QUFFYixvREFBNEI7QUFDNUIsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ25DLE1BQU0sRUFBQyxxQkFBcUIsRUFBRSx1QkFBdUIsRUFBRSxhQUFhLEVBQUMsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDNUYsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBRTVCLE1BQU0sYUFBYSxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsRUFBRTtJQUM5QyxPQUFPLEdBQUcsQ0FBQyxRQUFRLENBQUMsYUFBYTtRQUMvQixDQUFDLENBQUMsSUFBSSxFQUFFO1FBQ1IsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsSUFBSSx1QkFBdUIsRUFBRSxDQUFDLENBQUM7QUFDekQsQ0FBQyxDQUFDO0FBSlcsUUFBQSxhQUFhLGlCQUl4QjtBQUVGLE1BQU0sMEJBQTBCLEdBQUcsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLEVBQUU7SUFDbkQsT0FBTyxNQUFNLElBQUksS0FBSyxJQUFJLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1FBQ3RGLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1FBQ2hDLENBQUMsQ0FBQyxLQUFLLENBQUM7QUFDWixDQUFDLENBQUM7QUFFSyxNQUFNLFdBQVcsR0FBRyxDQUFDLEVBQUMsWUFBWSxHQUFHLElBQUksRUFBRSxNQUFNLEdBQUcsRUFBRSxFQUFFLFNBQVMsR0FBRyxPQUFPLEtBQTRELEVBQUMsWUFBWSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFO0lBQ3hOLE1BQU0sS0FBSyxHQUFHLGdCQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxVQUFVLFNBQVMsRUFBRSxDQUFDLENBQUM7SUFDckQsSUFBSSxDQUFDLEtBQUs7UUFDUixPQUFPLGFBQWEsQ0FBQyxJQUFJLEVBQUUsSUFBSSxxQkFBcUIsRUFBRSxDQUFDLENBQUM7SUFFMUQsTUFBTSxPQUFPLEdBQUcsTUFBTSxJQUFJLDBCQUEwQixDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNwRSxJQUFJLE9BQU8sRUFBRTtRQUNYLEdBQUcsQ0FBQyxRQUFRLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztRQUNsQyxHQUFHLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUM7UUFDOUIsT0FBTyxJQUFJLEVBQUUsQ0FBQztLQUNmO0lBRUQsWUFBWSxhQUFaLFlBQVksdUJBQVosWUFBWSxDQUFFLFVBQVUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxHQUFHLEVBQUUsV0FBVyxFQUFFLEVBQUU7UUFDbkQsSUFBSSxHQUFHLEVBQUU7WUFDUCxNQUFNLENBQUMsS0FBSyxDQUFDLHNDQUFzQyxFQUFFLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztZQUNqRSxPQUFPLGFBQWEsQ0FBQyxJQUFJLEVBQUUsSUFBSSxPQUFPLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxDQUFDO1NBQy9EO1FBRUQsSUFBSSxDQUFDLFdBQVc7WUFDZCxPQUFPLGFBQWEsQ0FBQyxJQUFJLEVBQUUsSUFBSSx1QkFBdUIsRUFBRSxDQUFDLENBQUM7UUFFNUQsaURBQWlEO1FBQ2pELDZDQUE2QztRQUM3QyxvRUFBb0U7UUFDcEUsTUFBTSxNQUFNLEdBQUcsQ0FBQyxPQUFPLFdBQVcsS0FBSyxRQUFRLENBQUM7WUFDOUMsQ0FBQyxDQUFDLFdBQVc7WUFDYixDQUFDLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDLDBDQUEwQztRQUVwRSxJQUFJLENBQUMsV0FBVztZQUNkLE9BQU8sYUFBYSxDQUFDLElBQUksRUFBRSxJQUFJLHVCQUF1QixFQUFFLENBQUMsQ0FBQztRQUU1RCxHQUFHLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDN0IsT0FBTyxJQUFJLEVBQUUsQ0FBQztJQUNoQixDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQztBQWxDVyxRQUFBLFdBQVcsZUFrQ3RCIn0=