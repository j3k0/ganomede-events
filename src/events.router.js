const async = require('async');
const secret = require('./secret');
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

  const getEvents = require('./events.middleware.get')
    .createMiddleware({store, poll});
  const postEvent = require('./events.middleware.post')
    .createMiddleware({store, poll});

  server.post(`${prefix}/events`,
    secret.checkSecret, postEvent);
  server.get(`${prefix}/events`,
    secret.checkSecret, getEvents);

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
