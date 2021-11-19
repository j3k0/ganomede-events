import { logger } from "./logger";
import { RedisClient } from "redis";

export const errors = {
  invalidMessage: 'invalid message',
  invalidClient: 'invalid redisClient',
  invalidHandler: 'invalid handler'
};

export class PubSub{

  redisPubClient: RedisClient;
  redisSubClient: RedisClient;

  isSubscribed:{[type: string]: boolean}= {};
  channelHandlers :{[type: string]: Array<(message:string) => void>}= {};

  constructor(redisPubClient: RedisClient, redisSubClient: RedisClient){
    this.redisPubClient = redisPubClient;
    this.redisSubClient = redisSubClient;

    const isValidClient = (redisClient: RedisClient) =>
    typeof redisClient === 'object' && redisClient !== null;

    if (!isValidClient(redisPubClient) || !isValidClient(redisSubClient))
      throw new Error(errors.invalidClient);

    // Listen for messages
    redisSubClient.on('message', (channel: string, message: string) => {
      // logger.info({channel, nHandlers:this.getChannelHandlers(channel).length},
        // 'message received from redis: ' + message);
      this.getChannelHandlers(channel).forEach(
        (handler) => handler(message));
    });
  }

  private isValidMessage = (msg: any) => (
    typeof msg === 'number' ||
      typeof msg === 'string' ||
      typeof msg === 'object' && msg instanceof Buffer);

  private isValidHandler = (hndlr: any) =>
    typeof hndlr === 'function';

   // List of handlers for each channel
   private addChannelHandler = (channel: string, handler: (message:string) => void) => {
    let handlers = this.channelHandlers[channel];
    if (!handlers)
      handlers = this.channelHandlers[channel] = [];
    handlers.push(handler);
  };
  private removeChannelHandler = (channel: string, handler: (message:string) => void) => {
    const handlers = this.channelHandlers[channel];
    const index = handlers.indexOf(handler);
    if (index >= 0)
      handlers.splice(index, 1);
  };
  private getChannelHandlers = (channel: string) =>
    this.channelHandlers[channel] || [];

  publish (channel: string, message: string, cb: (e: Error|null)=> void)  : void {

    // logger.info({channel}, 'pubsub.publish: ' + message);
    if (!this.isValidMessage(message))
      return cb(new Error(errors.invalidMessage));

    this.redisPubClient.publish(channel, message, cb);
  }

  subscribe (channel: string, handler: (message:string) => void, cb: (e: Error|null)=> void): void {

    // logger.info({channel}, 'pubsub.subscrcallHandlersibe');
    if (!this.isValidHandler(handler))
      return cb(new Error(errors.invalidHandler));

    this.addChannelHandler(channel, handler);
    if (!this.isSubscribed[channel]) {
      this.isSubscribed[channel] = true;
      this.redisSubClient.subscribe(channel, cb);
    }
    else {
      cb(null);
    }
  }

  unsubscribe (channel: string, handler: (message:string) => void, cb: (e: Error|null)=> void): void {

    // logger.info({channel}, 'pubsub.unsubscribe');
    if (!this.isValidHandler(handler))
      return cb(new Error(errors.invalidHandler));

    this.removeChannelHandler(channel, handler);
    cb(null);
  }

}

// export const createPubSub = (redisPubClient: RedisClient, redisSubClient: RedisClient ) => {

//   const isValidClient = (redisClient: RedisClient) =>
//     typeof redisClient === 'object' && redisClient !== null;

//   if (!isValidClient(redisPubClient) || !isValidClient(redisSubClient))
//     throw new Error(errors.invalidClient);

//   const isValidMessage = (msg: any) => (
//     typeof msg === 'number' ||
//       typeof msg === 'string' ||
//       typeof msg === 'object' && msg instanceof Buffer);

//   const isValidHandler = (hndlr: any) =>
//     typeof hndlr === 'function';

//   // List of handlers for each channel
//   const channelHandlers :{[type: string]: Array<(message:string) => void>}= {};
//   const addChannelHandler = (channel: string, handler: (message:string) => void) => {
//     let handlers = channelHandlers[channel];
//     if (!handlers)
//       handlers = channelHandlers[channel] = [];
//     handlers.push(handler);
//   };
//   const removeChannelHandler = (channel: string, handler: (message:string) => void) => {
//     const handlers = channelHandlers[channel];
//     const index = handlers.indexOf(handler);
//     if (index >= 0)
//       handlers.splice(index, 1);
//   };
//   const getChannelHandlers = (channel: string) =>
//     channelHandlers[channel] || [];

//   // Listen for messages
//   redisSubClient.on('message', (channel, message) => {
//     logger.info({channel, nHandlers:getChannelHandlers(channel).length},
//       'message received from redis: ' + message);
//     getChannelHandlers(channel).forEach(
//       (handler) => handler(message));
//   });

//   // Are we already susbscribed to a given channel
//   const isSubscribed:{[type: string]: boolean}= {};

//   return {

//     publish: (channel: string, message: string, cb: (e: Error|null)=> void) => {

//       logger.info({channel}, 'pubsub.publish: ' + message);
//       if (!isValidMessage(message))
//         return cb(new Error(errors.invalidMessage));

//       redisPubClient.publish(channel, message, cb);
//     },

//     subscribe: (channel: string, handler: (message:string) => void, cb: (e: Error|null)=> void) => {

//       logger.info({channel}, 'pubsub.subscribe');
//       if (!isValidHandler(handler))
//         return cb(new Error(errors.invalidHandler));

//       addChannelHandler(channel, handler);
//       if (!isSubscribed[channel]) {
//         isSubscribed[channel] = true;
//         redisSubClient.subscribe(channel, cb);
//       }
//       else {
//         cb(null);
//       }
//     },

//     unsubscribe: (channel: string, handler: (message:string) => void, cb: (e: Error|null)=> void) => {

//       logger.info({channel}, 'pubsub.unsubscribe');
//       if (!isValidHandler(handler))
//         return cb(new Error(errors.invalidHandler));

//       removeChannelHandler(channel, handler);
//       cb(null);
//     }
//   };
// };
 