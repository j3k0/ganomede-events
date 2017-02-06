( () => {

'use strict'

const utils = require('./utils')


//Constants
const invalidMessage = 'invalid message'
const invalidClient = 'invalid client'
const invalidHandler = 'invalid handler'


const _validClient = (client) => {
  return typeof client === 'object' && client !== null
}

const _validMessage = (msg) => {
  return typeof msg === 'number' ||
    typeof msg === 'string' ||
    typeof msg === 'object' && msg instanceof Buffer
}

const _validHandler = (hndlr) => {
  return typeof hndlr === 'function'
}

const publish = (client, channel, message, callback) => {
  let cb = utils.messageCallback.bind(null, callback)
  _validClient(client) || cb(invalidClient)
  _validMessage(message) || cb(invalidMessage)
  _validClient(client) && _validMessage(message) &&
    client.publish(String(channel), message, cb)
}

const subscribe = (client, channel, handler, callback) => {
  let cb = utils.messageCallback.bind(null, callback)
  _validClient(client) || cb(invalidClient)
  _validHandler(handler) || cb(invalidHandler)
  _validClient(client) && _validHandler(handler) && (() => {
    client.subscribe(String(channel), cb)
    client.addListener('message', handler)
  })()
}

const unsubscribe = (client, channel, handler, callback) => {
  let cb = utils.messageCallback.bind(null, callback)
  _validClient(client) || cb(invalidClient)
  _validHandler(handler) || cb(invalidHandler)
  _validClient(client) && _validHandler(handler) && (() => {
    client.unsubscribe(String(channel), cb)
    client.removeListener('message', handler)
  })()
}

module.exports = {
  invalidMessage,
  invalidClient,
  invalidHandler,
  publish,
  subscribe,
  unsubscribe,
}

})()
