'use strict';

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

const restify = require('restify');
const {parseGetParams} = require('./parse-http-params');
const pollForEvents = require('./poll-for-events');

const createMiddleware = ({
  poll = require('./poll'),
  log = require('./logger'),
  config = require('../config'),
  store
}) => (req, res, next) => {
  const params = parseGetParams(req.params);
  if (params instanceof Error)
    return next(new restify.InvalidContentError(params.message));

  pollForEvents(store, poll, params, (err, events) => {
    if (err) {
      log.error(err);
      return next(err);
    }

    res.json(events);
    next();
  });
};

module.exports = {createMiddleware};
