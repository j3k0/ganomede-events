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


// Constants
const channelProp = 'channel'
const afterProp = 'after'
const idProp = 'id'


const _sendJsonResponse = (res, msg, next) => {
  res.header('Content-Type', 'application/json; charset=UTF-8')
  res.json(msg)
  next()
}

const _invalidPostContent = (err) => {
  return err === store.invalidEvent ||
    err === store.invalidChannel
}

const _formatPostError = (err) => {
  return _invalidPostContent(err) ? new restify.InvalidContentError('invalid content') :
    null
}

const postEvent = (client, pub, req, res, next) => {
  let body = utils.stringToObject(req.body)
  let ch = body[channelProp]
  delete body[channelProp]
  next = utils.loggingCallback.bind(null, next)
  store.addEvent(client, body, ch, (error, id_time) => {
    let err = _formatPostError(error)
    err && next(err)
    err || (() => {
      _sendJsonResponse(res, id_time, next)
      poll.trigger(pub, ch, id_time[idProp], (err) => {
        err && next(new restify.InternalServerError('wrong use of poll trigger'))
      })
    })()
  })
}

const _invalidGetContent = (err) => {
  return err === store.invalidChannel ||
    err === store.invalidAfterId
}

const _formatGetError = (err) => {
  return _invalidGetContent(err) ? new restify.InvalidContentError('invalid content') :
    null
}

const _trigger = (res, next, client, id, channel, message, clear) => {
  let afterId = utils.zeroIfNaN(id)
  message > afterId && (() => {
    clear()
    store.getEventsAfterId(client, channel, afterId, (error, events) => {
      let err = _formatGetError(error)
      err && next(err)
      err ||
        _sendJsonResponse(res, events, next)
    })
  })()
}

const _timeout = (next, unsubscribe) => {
  unsubscribe()
  next(new restify.RequestTimeoutError('request timeout'))
}

const getEvents = (client, sub, req, res, next) => {
  let params = utils.stringToObject(req.params)
  let ch = params[channelProp]
  let id = params[afterProp]
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
