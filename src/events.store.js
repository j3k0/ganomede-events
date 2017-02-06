( () => {

'use strict'

const async = require('async')
const store = require('./redis.store')
const utils = require('./utils')


// Constants
const idProp = 'id'
const timeProp = 'timestamp'
const dataProp = 'data'

const invalidEvent = 'invalid event'
const invalidChannel = 'invalid channel'
const invalidAfterId = 'invalid after ID'

const _validEvent = (event) => {
  return typeof event === 'object' && event !== null
}

const _validChannel = (channel) => {
  return typeof channel === 'string'
}

const _createResponse = (item, ndx) => {
  let res = {
    id: ndx,
    timestamp: item[timeProp]
  }
  return res
}

const _setEventProperties = (event, ndx) => {
  event[idProp] = ndx
  event[timeProp] = new Date().getTime()
  return event
}

const _formatEventDataForStore = (event) => {
  dataProp in event &&
    (event[dataProp] = utils.objectToString(event[dataProp]))
  return event
}

const _transformEvent = (event, ndx) => {
  event = _setEventProperties(event, ndx)
  event = _formatEventDataForStore(event)
  return event
}

// ToDo: Move channel checking to caller
const addEvent = (client, event, channel, callback) => {
  let cb = utils.messageCallback.bind(null, callback)
  _validEvent(event) || cb(invalidEvent)
  _validChannel(channel) || cb(invalidChannel)
  _validEvent(event) && _validChannel(channel) &&
    store.addItem(client, event, channel, _transformEvent, _createResponse, cb)
}

const _validAfterId = (after) => {
  return after === undefined ||
    typeof after === 'number' || 
    typeof after === 'string' && !isNaN(parseInt(after))
}

const _formatEventNumbers = (event) => {
  event[idProp] = parseInt(event[idProp])
  event[timeProp] = parseInt(event[timeProp])
  return event
}

const _formatEventDataForUse = (event) => {
  dataProp in event &&
    (event[dataProp] = utils.stringToObject(event[dataProp]))
  return event
}

const _formatEvent = (event) => {
  event = _formatEventNumbers(event)
  event = _formatEventDataForUse(event)
  return event
}

// ToDo: Move channel and after ID checking to caller
const getEventsAfterId = (client, channel, id, callback) => {
  let cb = utils.messageCallback.bind(null, callback)
  _validChannel(channel) || cb(invalidChannel)
  _validAfterId(id) || cb(invalidAfterId)
  _validChannel(channel) && _validAfterId(id) &&
    store.getItems(client, channel, id, _formatEvent, cb)
}

module.exports = {
  invalidEvent,
  invalidChannel,
  invalidAfterId,
  addEvent,
  getEventsAfterId,
}

})()
