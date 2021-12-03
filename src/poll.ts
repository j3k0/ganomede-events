
import { zeroIfNaN } from './utils';
import { logger } from './logger';
import { config } from '../config';
import bunyan from 'bunyan';
import { PubSub } from './redis.pubsub';

export type PollConfig = {
  pubsub: PubSub | null;
  log?: bunyan;
  pollTimeout?: number;
  setTimeout?: typeof global.setTimeout;
  clearTimeout?: typeof global.clearTimeout;
}

export class Poll {

  pubsub: PubSub | null;
  log: bunyan;
  pollTimeout: number;
  setTimeout: typeof global.setTimeout;
  clearTimeout: typeof global.clearTimeout;
  logError = (err: Error | null) => err && this.log.error(err);

  constructor(options: PollConfig = {
    pubsub: null,
    log: logger,
    pollTimeout: zeroIfNaN(config.pollTimeout),
    setTimeout: global.setTimeout,
    clearTimeout: global.clearTimeout
  }) {
    this.pubsub = options.pubsub;
    this.log = options.log!;
    this.pollTimeout = options.pollTimeout!;
    this.setTimeout = options.setTimeout!;
    this.clearTimeout = options.clearTimeout!;
  }

  public listen = (channel?: string, callback?: ((e: Error | null, m: string | null | number) => void | boolean) | null) => {
    const done = (err: Error | null, message: string | null) => {
      if (timeoutId) {
        this.clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (handler) {
        this.pubsub?.unsubscribe(channel!, handler, this.logError);
        handler = null;
      }
      if (callback) {
        const cb = callback;
        callback = null;
        cb(err, message);
      }
    };

    const timeout = () => done(null, null);
    let timeoutId: null | ReturnType<typeof global.setTimeout> = this.setTimeout(timeout, this.pollTimeout);
    let handler: null | ((message: any) => void) = (message: any) => done(null, message);
    this.pubsub?.subscribe(channel!, handler, this.logError);
  };

  public emit = (channel: string, message: string, callback: (e: Error | null) => void) => {
    this.pubsub?.publish(channel, message, callback);
  };
}

// export const createPoll = (
//   pubsub: PubSub,
//   log: bunyan = logger,
//   pollTimeout = zeroIfNaN(config.pollTimeout),
//   setTimeout = global.setTimeout,
//   clearTimeout = global.clearTimeout
//  ) : {listen: (channel: string, callback: any) => void,
//   emit: (channel: string, message: string, callback: () => void) => void}=> {

//   const logError = (err: Error|null) => err && log.error(err);

//   const listen = (channel: string, callback: ((e: Error|null, m: string|null)  => void) | null) => {

//     const done = (err: Error|null, message: string|null) => {
//       if (timeoutId) {
//         clearTimeout(timeoutId);
//         timeoutId = null;
//       }
//       if (handler) {
//         pubsub?.unsubscribe(channel, handler, logError);
//         handler = null;
//       }
//       if (callback) {
//         const cb = callback;
//         callback = null;
//         cb(err, message);
//       }
//     };

//     const timeout = () => done(null, null);
//     let timeoutId : null | ReturnType<typeof setTimeout> = setTimeout(timeout, pollTimeout);
//     let handler : null | ((message:any)=>void)  = (message: any) => done(null, message);
//     pubsub.subscribe(channel, handler, logError);
//   };

//   const emit = (channel: string, message: string, callback: () => void) => {
//     pubsub.publish(channel, message, callback);
//   };

//   return {listen, emit};
// };
