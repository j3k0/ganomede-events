'use strict';

const restify = require('restify');
const utils = require('./utils');
const config = require('../config');

const _getParams = (req) => {
  return (
    (req.method === 'GET') &&
      req.params ||
    (req.method === 'POST') &&
      utils.stringToObject(req.body)
  );
};

const removeSecret = (req, next) => {
  if (req.method === 'GET') {
    delete req.params.secret;
  } else if (req.method === 'POST') {
    let data = utils.stringToObject(req.body);
    delete data.secret;
    req.body = utils.objectToString(data);
  }
  return next;
};

const checkSecret = (req, res, next) => {
  let data = _getParams(req);

  return (
    !('secret' in data) &&
      utils.logError(new restify.InvalidContentError('invalid content'), next) ||
    (data.secret !== config.secret) &&
      utils.logError(new restify.UnauthorizedError('not authorized'), removeSecret(req, next)) ||
    removeSecret(req, next)()
  );
};

module.exports = {
  checkSecret: checkSecret,
};