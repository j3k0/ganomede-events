'use strict';

const curtain = require('curtain-down');
const redis = require('redis');
const restify = require('restify');
const config = require('../config');
const secret = require('./secret');
const store = require('./events.store');
const utils = require('./utils');

const client = redis.createClient(config.redis.port, config.redis.host);
curtain.on(() => {
  client.quit();
});

const addEvent = (req, res, next) => {
  try {
    let body = utils.stringToObject(req.body);
    store.addEvent(client, body, (err, msg) => {
      res.header('Content-Type', 'application/json; charset=UTF-8');
      res.json(msg);
      next();
    });
  } catch (e) {
    if (e instanceof TypeError) {
      res.end(
        utils.logError(new restify.InvalidContentError('invalid content'), next)
      );
    } else {
      throw e;
    }
  };
};

const getEvents = (req, res, next) => {
  try {
    let params = utils.stringToObject(req.params);
    store.getEvents(client, params, (err, msg) => {
      res.header('Content-Type', 'application/json; charset=UTF-8');
      res.json(msg);
      next();
    });
  } catch (e) {
    if (e instanceof TypeError) {
      res.end(
        utils.logError(new restify.InvalidContentError('invalid content'), next)
      );
    } else {
      throw e;
    }
  };
};

module.exports = (prefix, server) => {
  server.use(secret.checkSecret);
  server.get(`${prefix}/events`, getEvents);
  server.post(`${prefix}/events`, addEvent);
};
