'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidCredentialsError = exports.InvalidAuthTokenError = exports.RequestValidationError = void 0;
const util = require('util');
const restify = require('restify');
const logger = require('./logger');
// The way to distinguish our app's logic-level errors from others.
// (Like `socket hang up` vs `user already exists`.)
//
// So the basic idea is to create things like @UserNotFoundError (see below),
// define appropriate statusCode and message on it (maybe some params),
// and return those from lower-level places. Then:
//
//   app.get('/users/:id', (req, res) => {
//     if (req.params.id.lengt < 3) // some check
//       return sendHttpError(new restify.BadRequestError());
//
//     orm.findUser(req.params.id, (err, user) => {
//       return err
//         ? sendHttpError(next, err) // this would be instance of UserNotFoundError
//                                    // or perhaps some other GanomedeError, so it'll
//                                    // get converted via #toRestError().
//                                    // Otherwise it'll be passed to default handler.
//         : res.json(user);
//     });
//   })
//
// It can also be sometimes useful to add error classes for driver's errors.
// This way we push mapping between some obscure error codes and stuff closer
// to our app into the wrapper. For example:
//
//    // db-wrapper.js
//    class Db {}
//    Db.MissingDocumentError = class MissingDocument extends GanomedeError {};
//    module.exports = Db;
//
//    // orm.js
//    const findUser = (userId, callback) => {
//      new Db().fetchDocument(userId, (err, json) => {
//        if (err instanceof Db.MissingDocumentError) {
//          // here we now what missing document means
//          // (and DB knows how to distinguish missing document errors
//          // from, say, "cannot connect to hostname")
//          return callback(new UserNotFoundError(userId));
//
//        // …
//      });
//    };
// Values for error#severity: how to print it inside `sendHttpError`.
// https://github.com/j3k0/ganomede/issues/11
// https://github.com/trentm/node-bunyan#levels
const severity = {
    fatal: 'fatal',
    error: 'error',
    warn: 'warn',
    info: 'info',
    debug: 'debug',
    trace: 'trace' // (10): Logging from external libraries used by your app or very detailed application logging.
};
class GanomedeError extends Error {
    constructor(...messageArgs) {
        super();
        this.statusCode = 0;
        this.name = this.constructor.name;
        this.severity = severity.error;
        if (messageArgs.length > 0)
            this.message = util.format.apply(util, messageArgs);
        Error.captureStackTrace(this, this.constructor);
    }
}
// This is for validation errors (like missing `body` or certain parts of it),
// same as base error except it allows to specify custom restCode
// via changing instance's .name (see GanomedeError#toRestError()).
//
// Use like this:
//
//   if (!req.body.userId) {
//     const err = new RequestValidationError('BadUserId', 'Invalid or missing User ID');
//     return sendHttpError(next, err);
//   }
//
//   // will result in http 404 with json body:
//   // { "code": "BadUserId",
//   //   "message": "Invalid or missing User ID" }
class RequestValidationError extends GanomedeError {
    constructor(name, ...messageArgs) {
        super(...messageArgs);
        this.name = name;
        this.statusCode = 400;
        this.severity = severity.info;
    }
}
exports.RequestValidationError = RequestValidationError;
class InvalidAuthTokenError extends GanomedeError {
    constructor() {
        super('Invalid auth token');
        this.statusCode = 401;
        this.severity = severity.info;
    }
}
exports.InvalidAuthTokenError = InvalidAuthTokenError;
class InvalidCredentialsError extends GanomedeError {
    constructor() {
        super('Invalid credentials');
        this.statusCode = 401;
        this.severity = severity.info;
    }
}
exports.InvalidCredentialsError = InvalidCredentialsError;
const toRestError = (error) => {
    if (!error.statusCode)
        throw new Error(`Please define "statusCode" prop for ${error.constructor.name}`);
    return new restify.RestError({
        restCode: error.name,
        statusCode: error.statusCode,
        message: error.message
    });
};
const captureStack = () => {
    const o = { stack: '' };
    Error.captureStackTrace(o, captureStack);
    return o.stack;
};
// Kept forgetting `next` part, so let's change this to (next, err).
const sendHttpError = (next, err) => {
    // When we have an instance of GanomedeError, it means stuff that's defined here, in this file.
    // So those have `statusCode` and convertable to rest errors.
    // In case they don't, we die (because programmers error ("upcast" it) not runtime's).
    if (err instanceof GanomedeError) {
        logger[err.severity](err);
        return next(toRestError(err));
    }
    // # Printing
    //
    // We mostly upcast our app-logic errors to GanomedeError,
    // but some things may come up as restify.HttpError
    // (e.g. InternalServerError instance may end up here).
    // So we treat them with "error" severity.
    //
    // # Stack Trace
    // https://github.com/j3k0/ganomede-boilerplate/issues/10
    // https://github.com/j3k0/ganomede-directory/issues/15
    //
    // With restify errors, which we usually create ourselves,
    // stack points to the right place, but in some cases,
    // we can get error that was created on different event loop tick.
    //
    // Though we rely on lower levels to print those kinds of errors,
    // we still must know the place sendHttpError was called from.
    logger.error(err, { sendHttpErrorStack: captureStack() });
    next(err);
};
module.exports = {
    GanomedeError,
    RequestValidationError,
    InvalidAuthTokenError,
    InvalidCredentialsError,
    sendHttpError,
    severity
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3JzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2Vycm9ycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7OztBQUViLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM3QixNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDbkMsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBRW5DLG1FQUFtRTtBQUNuRSxvREFBb0Q7QUFDcEQsRUFBRTtBQUNGLDZFQUE2RTtBQUM3RSx1RUFBdUU7QUFDdkUsa0RBQWtEO0FBQ2xELEVBQUU7QUFDRiwwQ0FBMEM7QUFDMUMsaURBQWlEO0FBQ2pELDZEQUE2RDtBQUM3RCxFQUFFO0FBQ0YsbURBQW1EO0FBQ25ELG1CQUFtQjtBQUNuQixvRkFBb0Y7QUFDcEYsc0ZBQXNGO0FBQ3RGLDBFQUEwRTtBQUMxRSxzRkFBc0Y7QUFDdEYsNEJBQTRCO0FBQzVCLFVBQVU7QUFDVixPQUFPO0FBQ1AsRUFBRTtBQUNGLDRFQUE0RTtBQUM1RSw2RUFBNkU7QUFDN0UsNENBQTRDO0FBQzVDLEVBQUU7QUFDRixzQkFBc0I7QUFDdEIsaUJBQWlCO0FBQ2pCLCtFQUErRTtBQUMvRSwwQkFBMEI7QUFDMUIsRUFBRTtBQUNGLGVBQWU7QUFDZiw4Q0FBOEM7QUFDOUMsdURBQXVEO0FBQ3ZELHVEQUF1RDtBQUN2RCxzREFBc0Q7QUFDdEQsdUVBQXVFO0FBQ3ZFLHVEQUF1RDtBQUN2RCwyREFBMkQ7QUFDM0QsRUFBRTtBQUNGLGNBQWM7QUFDZCxXQUFXO0FBQ1gsUUFBUTtBQUVSLHFFQUFxRTtBQUNyRSw2Q0FBNkM7QUFDN0MsK0NBQStDO0FBQy9DLE1BQU0sUUFBUSxHQUFHO0lBQ2YsS0FBSyxFQUFFLE9BQU87SUFDZCxLQUFLLEVBQUUsT0FBTztJQUNkLElBQUksRUFBRSxNQUFNO0lBQ1osSUFBSSxFQUFF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