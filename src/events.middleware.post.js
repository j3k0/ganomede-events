'use strict';

const restify = require('restify');
const _ = require('lodash');

const createMiddleware = ({
  poll = require('./poll'),
  log = require('./logger'),
  store
}) => (req, res, next) => {

  const channel = req.body.channel;
  const event = _.pick(req.body, 'from', 'type', 'data');

  if (!channel)
    return next(new restify.InvalidContentError('channel missing'));

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

module.exports = {createMiddleware};
