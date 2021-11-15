'use strict';

import restify from 'restify';
const {parsePostParams} = require('./parse-http-params');

const createMiddleware = ({
  poll = require('./poll'),
  log = require('./logger'),
  store
}) => (req, res, next) => {
  const params = parsePostParams(req.body);
  if (params instanceof Error)
    return next(new restify.InvalidContentError(params.message));

  const {channel, event} = params;

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
