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

const eventsStore = require('./events.store');
const utils = require('./utils');
const restify = require('restify');

const createMiddleware = ({
  poll = require('./poll'),
  log = require('./logger'),
  config = require('../config'),
  store
}) => (req, res, next) => {

  const {channel, after, limit} = req.params;
  const afterId = utils.zeroIfNaN(after);
  const lim = (!limit || isNaN(limit) || limit == 0) ? 100 : limit;

  if (!channel)
    return next(new restify.InvalidContentError('channel missing'));

  const json = (data) => {
    res.json(data);
    next();
  };

  // Process the outcome of store.loadEvents,
  // returns true iff the middleware's job is over (next was called).
  const processLoad = (err, events, minimalEventsCount = 0) => {
    if (err)
      return next(convertError(err)), true;
    else if (events.length >= minimalEventsCount)
      return json(events), true;
    else
      return false;
  };

  // Process the outcome of poll.listen
  //  - when a new message is received,
  //         -> reload and output events.
  //  - when no new messages are received,
  //         -> output an empty array
  const processPoll = (err, message) => {
    if (err) {
      log.error(err);
      next(new restify.InternalServerError('polling failed'));
    }
    else {
      if (message > afterId)
        store.loadEvents(channel, afterId, lim, processLoad);
      else
        json([]); // timeout is not an error but expected behavior
    }
  };

  const pollEvents = () =>
    poll.listen(channel, processPoll);

  store.loadEvents(channel, afterId, lim, (err, events) => {
    return processLoad(err, events, 1) || pollEvents();
  });
};

const convertError = (err) => {
  return isInvalidContent(err)
    ? new restify.InvalidContentError(err.message)
    : err;
};

const isInvalidContent = (err) => {
  return err && (err.message === eventsStore.errors.invalidChannel
    || err.message === eventsStore.errors.invalidAfterId);
};

module.exports = {createMiddleware};
