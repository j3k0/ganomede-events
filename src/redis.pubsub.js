'use strict';

const errors = {
  invalidMessage: 'invalid message',
  invalidClient: 'invalid redisClient',
  invalidHandler: 'invalid handler'
};

const createPubSub = ({
  redisPubClient,
  redisSubClient
}) => {

  const isValidClient = (redisClient) =>
    typeof redisClient === 'object' && redisClient !== null;

  if (!isValidClient(redisPubClient) || !isValidClient(redisSubClient))
    throw new Error(errors.invalidClient);

  const isValidMessage = (msg) => (
    typeof msg === 'number' ||
      typeof msg === 'string' ||
      typeof msg === 'object' && msg instanceof Buffer);

  const isValidHandler = (hndlr) =>
    typeof hndlr === 'function';

  // List of handlers for each channel
  const channelHandlers = {};
  const addChannelHandler = (channel, handler) => {
    let handlers = channelHandlers[channel];
    if (!handlers)
      handlers = channelHandlers[channel] = [];
    handlers.push(handler);
  };
  const removeChannelHandler = (channel, handler) => {
    const handlers = channelHandlers[channel];
    const index = handlers.indexOf(handler);
    if (index >= 0)
      handlers.splice(index, 1);
  };
  const getChannelHandlers = (channel) =>
    channelHandlers[channel] || [];

  // Listen for messages
  redisSubClient.on('message', (channel, message) => {
    getChannelHandlers(channel).forEach(
      (handler) => handler(message));
  });

  // Are we already susbscribed to a given channel
  const isSubscribed = {};

  return {

    publish: (channel, message, cb) => {

      if (!isValidMessage(message))
        return cb(new Error(errors.invalidMessage));

      redisPubClient.publish(channel, message, cb);
    },

    subscribe: (channel, handler, cb) => {

      if (!isValidHandler(handler))
        return cb(new Error(errors.invalidHandler));

      addChannelHandler(channel, handler);
      if (!isSubscribed[channel]) {
        isSubscribed[channel] = true;
        redisSubClient.subscribe(channel, cb);
      }
      else {
        cb(null);
      }
    },

    unsubscribe: (channel, handler, cb) => {

      if (!isValidHandler(handler))
        return cb(new Error(errors.invalidHandler));

      removeChannelHandler(channel, handler);
      cb(null);
    }
  };
};

module.exports = {
  errors,
  createPubSub
};
