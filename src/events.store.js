const async = require('async')
const store = require('./redis.store')
const utils = require('./utils')
const identity = (x) => x

// Constants
const idProp = 'id'
const timeProp = 'timestamp'
const dataProp = 'data'

const invalidEvent = 'invalid event'
const invalidChannel = 'invalid channel'
const invalidAfterId = 'invalid after ID'

const isValidEvent = (event) =>
  typeof event === 'object' && event !== null

const isValidChannel = (channel) =>
  typeof channel === 'string'

const eventData = (eventData) =>
  eventData ? { data: JSON.stringify(eventData) } : {}

const eventBase = (index, timestamp) => ({
  id: index,
  timestamp
})

const eventFactory = (data, index) =>
  Object.assign({}, data,
  eventBase(index, new Date().getTime()),
  eventData(data.data))

const addEvent = (redisClient, event, channel, callback) => {

  if (!isValidEvent(event))
    return callback(invalidEvent)
  if (!isValidChannel(channel))
    return callback(invalidChannel)

  store.addItem(redisClient, event, channel, eventFactory, callback)
}

const isValidAfterId = (after) => {
  return after === undefined ||
    typeof after === 'number' || 
    typeof after === 'string' && !isNaN(parseInt(after))
}

const formatEventCore = (event) => ({
  id: parseInt(event.id),
  timestamp: parseInt(event.timestamp)
})

const formatEventData = (eventData) =>
  eventData ? { data: JSON.parse(eventData) } : {}

const formatEvent = (event) => Object.assign({},
  formatEventCore(event),
  formatEventData(event.data))

const getEventsAfterId = (redisClient, channel, id, callback) => {

  callback = callback || identity

  if (!isValidChannel(channel))
    return callback(new Error(invalidChannel))

  if (!isValidAfterId(id))
    return callback(new Error(invalidAfterId))

  const done = (err, items) => err
    ? callback(err)
    : callback(null, items.map(formatEvent))

  store.getItems(redisClient, channel, id, done)
}

module.exports = {
  invalidEvent,
  invalidChannel,
  invalidAfterId,
  addEvent,
  getEventsAfterId,
}
