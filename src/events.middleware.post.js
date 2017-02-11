// restify middleware that adds an event to a channel
//
// Request body is JSON with fields:
//  - channel: string
//             channel to load events from
//  - from, type, data: event properties (see README.md)
//
// Reponds with a JSON event with its allocated id
//
const eventsStore = require('./events.store')
const restify = require('restify')
const _ = require('lodash')

const createMiddleware = ({
  poll   = require('./poll'),
  log    = require('./logger'),
  store
}) => (req, res, next) => {

  const channel = req.body.channel
  const event = _.pick(req.body, 'from', 'type', 'data')

  if (!channel)
    return next(new restify.InvalidContentError('channel missing'))

  store.addEvent(channel, event, (err, event) => {

    if (err)
      return next(convertError(err))

    res.json(event)
    next();

    // notify poll listeners of the new event (in background)
    poll.emit(channel, event.id, (err) => {

      // ignore success, log errors
      if (err)
        log.error(err, 'poll.trigger failed')
    })
  })
}

const isInvalidContent = (err) =>
  err === eventsStore.errors.invalidEvent ||
  err === eventsStore.errors.invalidChannel

const convertError = (err) =>
  isInvalidContent(err)
    ? new restify.InvalidContentError(err.message)
    : err

module.exports = { createMiddleware }
