'use strict';

// restify middleware that loads and outputs latest events
// from a given channel
//
// GET parameters:
//  - channel: string
//             channel to load events from
//
// Reponds with a JSON array of events (see README.md)
//

import restify from 'restify';
const {parseLatestGetParams} = require('./parse-http-params');

const createMiddleware = ({
  // poll = require('./poll'),
  // log = require('./logger'),
  // config = require('../config'),
  store
}) => (req, res, next) => {
  const params = parseLatestGetParams(req.params);
  if (params instanceof Error)
    return next(new restify.InvalidContentError(params.message));

  const {channel, limit} = params;

  store.loadLatestItems(channel, limit, (err, data) => {

    if (err)
      return next(err);

    res.json(data);
    next();
  });

};

module.exports = {createMiddleware};
