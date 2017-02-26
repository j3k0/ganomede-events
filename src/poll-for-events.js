'use strict';

const restify = require('restify');

module.exports = (store, poll, {clientId, channel, after, limit}, callback) => {
  const loadEvents = (cb) =>
    store.loadEvents(channel, after, limit, cb);

  // Process the outcome of store.loadEvents,
  // returns true iff the middleware's job is over (next was called).
  const processLoad = (err, events, minimalEventsCount = 0) => {
    if (err) {
      callback(err);
      return true;
    }

    if (events.length >= minimalEventsCount) {
      callback(null, events);
      return true;
    }

    return false;
  };

  // Process the outcome of poll.listen
  //  - when a new message is received,
  //         -> reload and output events.
  //  - when no new messages are received,
  //         -> output an empty array
  const processPoll = (err, message) => {
    if (err)
      return callback(new restify.InternalServerError('polling failed'));
    else {
      if (message > after)
        return loadEvents(processLoad);
      else
        return processLoad(null, []); // timeout is not an error but expected behavior
    }
  };

  const pollEvents = () => poll.listen(channel, processPoll);

  loadEvents((err, events) =>
    (processLoad(err, events, 1) || pollEvents()));
};
