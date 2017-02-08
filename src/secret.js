( () => {

'use strict'

const restify = require('restify')
const utils = require('./utils')
const config = require('../config')
const logger = require('./logger');

const secretProp = 'secret'

const _getParams = (req) => {
  return req.method === 'GET' ? req.params :
    req.method === 'POST' ? utils.stringToObject(req.body) :
    undefined
}

const _missingSecret = (data) => {
  return !(secretProp in data)
}

const _invalidSecret = (secret) => {
  return secret !== config[secretProp]
}

const _getError = (data) => {
  return _missingSecret(data) ? new restify.InvalidContentError('invalid content') :
    _invalidSecret(data[secretProp]) ? new restify.UnauthorizedError('not authorized') :
    null
}

const _removeSecret = (req) => {
  if (req.method === 'GET') {
    delete req.params[secretProp]
  } else if (req.method === 'POST') {
    let data = utils.stringToObject(req.body)
    delete data[secretProp]
    req.body = utils.objectToString(data)
  }
}

const checkSecret = (req, res, next) => {
  let data = _getParams(req)
  let err = _getError(data)
  if (!_missingSecret(data))
    _removeSecret(req)
  if (err) logger.error(err, "checkSecret failed");
  next(err);
}

module.exports = {
  checkSecret,
}

})()
