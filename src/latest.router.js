'use strict';


const async = require('async');
const {requireSecret} = require('./middlewares');
const eventsStore = require('./events.store');
const redisStore = require('./redis.store');
const redisPubSub = require('./redis.pubsub');
const {createPoll} = require('./poll');


const router = (prefix, server, redisClient) => {


  const itemsStore = redisStore.createStore({redisClient});
  const store = eventsStore.createStore({itemsStore});
  const redisPubClient = redisClient.duplicate();
  const redisSubClient = redisClient.duplicate();
  const pubsub = redisPubSub.createPubSub({
    redisPubClient, redisSubClient
  });
  const poll = createPoll({pubsub});

  const getLatest = require('./latest.middleware.get')
    .createMiddleware({store, poll});

  server.get('/latest', requireSecret, getLatest);
  server.get(`${prefix}/latest`, requireSecret, getLatest);

  return {
    close: (cb) => {
      async.parallel([
        (cb) => redisPubClient.quit(cb),
        (cb) => redisSubClient.quit(cb)
      ], cb);
    }
  };
};

module.exports = router;
