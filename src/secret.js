'use strict';

const restify = require('restify');
const config = require('../config');
const logger = require('./logger');

const getParams = (req) => {
  return req.method === 'GET'
    ? req.params
    : req.method === 'POST'
      ? req.body
      : undefined;
};

const missingSecret = (data) => !data.secret;
const invalidSecret = (data) => data.secret !== config.secret;

const getError = (data) => {
  return missingSecret(data)
    ? new restify.InvalidContentError('missing secret')
    : invalidSecret(data)
      ? new restify.UnauthorizedError('invalid secret')
      : null;
};

const removeSecret = (req) => {
  if (req.params && req.params.secret)
    delete req.params.secret;
  if (req.body && req.body.secret)
    delete req.body.secret;
};

const checkSecret = (req, res, next) => {
  const data = getParams(req);
  const err = getError(data);
  removeSecret(req);
  if (err)
    logger.error(err, 'checkSecret failed');
  next(err);
};

module.exports = {
  checkSecret
};
