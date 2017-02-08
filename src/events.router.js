( () => {

'use strict'

const curtain = require('curtain-down')
const redis = require('redis')
const restify = require('restify')
const config = require('../config')
const poll = require('./poll')
const secret = require('./secret')
const store = require('./events.store')
const utils = require('./utils')
const logger = require('./logger')


const _sendJsonResponse = (res, msg, next) => {
  res.header('Content-Type', 'application/json; charset=UTF-8')
  res.json(msg)
  next()
}

const isInvalidPostContent = (err) =>
  err === store.invalidEvent ||
  err === store.invalidChannel

const formatPostError = (err) =>
  isInvalidPostContent(err)
    ? new restify.InvalidContentError('invalid content')
    : err

const postEvent = (client, pub, req, res, next) => {
  // let body = utils.stringToObject(req.body)
  const body = req.body
  logger.info({body:req.body})
  const ch = body.channel
  // next = utils.loggingCallback.bind(null, next)
  store.addEvent(client, body, ch, (err, id_time) => {
    if (err)
      return next(formatPostError(err))
    _sendJsonResponse(res, id_time, next)
    poll.trigger(pub, ch, id_time.id, (err) => {
      if (err)
        log.error(err, 'poll.trigger failed')
    })
  })
}

const isInvalidGetContent = (err) =>
  err === store.invalidChannel
    || err === store.invalidAfterId

const _formatGetError = (err) =>
  isInvalidGetContent(err)
    ? new restify.InvalidContentError('invalid content')
    : err

const _trigger = (res, next, client, id, channel, message, clear) => {
  const afterId = utils.zeroIfNaN(id)
  if (message > afterId) {
    clear()
    store.getEventsAfterId(client, channel, afterId, (error, events) => {
      const err = _formatGetError(error)
      if (err)
        next(err)
      else
        _sendJsonResponse(res, events, next)
    })
  }
}

const _timeout = (next, unsubscribe) => {
  unsubscribe()
  next(new restify.RequestTimeoutError('request timeout'))
}

const getEvents = (client, sub, req, res, next) => {
  let params = utils.stringToObject(req.params)
  let ch = params.channel
  let id = params.after
  next = utils.loggingCallback.bind(null, next)
  store.getEventsAfterId(client, ch, id, (error, events) => {
    let err = _formatGetError(error)
    err && next(err)
    err || (() => {
      events.length > 0 && _sendJsonResponse(res, events, next)
      events.length > 0 ||
        poll.add(sub, ch, config.pollDuration,
          _trigger.bind(null, res, next, client, id), _timeout.bind(null, next), (err) => {
            err && next(new restify.InternalServerError('wrong use of poll add'))
          })
    })()
  })
}

module.exports = (prefix, server, client, sub, pub) => {
  server.use(secret.checkSecret)
  server.post(`${prefix}/events`, postEvent.bind(null, client, pub))
  server.get(`${prefix}/events`, getEvents.bind(null, client, sub))
}

})()
