( () => {

'use strict'

const {expect} = require('chai')
const async = require('async')
const redis = require('fakeredis')
const pubsub = require('../src/redis.pubsub')

describe('Publish To Channel', () => {

  let pub, sub
  let channel = 'channel'
  let message = 'message'

  before(done => {
    pub = redis.createClient(0, 'localhost')
    sub = redis.createClient(0, 'localhost')
    done()
  })

  after(done => {
    pub.quit()
    sub.quit()
    done()
  })

  it('should not return an error when client is not null or undefined', (done) => {
    pubsub.publish(pub, channel, message, (err, msg) => {
      expect(err).to.be.null
      done()
    })
  })

  it('should return an error when client is undefined', (done) => {
    pubsub.publish(undefined, channel, message, (err, msg) => {
      expect(err).to.not.be.null
      done()
    })
  })

  it('should return an error when client is null', (done) => {
    pubsub.publish(null, channel, message, (err, msg) => {
      expect(err).to.not.be.null
      done()
    })
  })

  it('should allow parallel use of the same client', (done) => {
    const expects = (err, msgs) => {
      expect(err).to.be.null
      done()
    }
    async.parallel([
      pubsub.publish.bind(null, pub, channel, Buffer.from([])),
      pubsub.publish.bind(null, pub, channel, Buffer.from([])),
      pubsub.publish.bind(null, pub, channel, Buffer.from([])),
      pubsub.publish.bind(null, pub, channel, Buffer.from([])),
    ], expects)
  })

  it('should not return an error when message is a string', (done) => {
    pubsub.publish(pub, channel, message, (err, msg) => {
      expect(err).to.be.null
      done()
    })
  })

  it('should not return an error when message is a buffer', (done) => {
    pubsub.publish(pub, channel, Buffer.from([]), (err, msg) => {
      expect(err).to.be.null
      done()
    })
  })

  it('should not return an error when message is a number', (done) => {
    pubsub.publish(pub, channel, 0, (err, msg) => {
      expect(err).to.be.null
      done()
    })
  })

  it('should return an error when message is not a valid type', (done) => {
    pubsub.publish(pub, channel, {}, (err, msg) => {
      expect(err).to.not.be.null
      done()
    })
  })

  it('should allow parallel use of the same message', (done) => {
    const expects = (err, msgs) => {
      expect(err).to.be.null
      done()
    }
    async.parallel([
      pubsub.publish.bind(null, pub, channel, message),
      pubsub.publish.bind(null, pub, channel, message),
      pubsub.publish.bind(null, pub, channel, message),
      pubsub.publish.bind(null, pub, channel, message),
    ], expects)
  })

  it('should send message to channel', (done) => {
    let handler = (ch, msg) => {
      expect(ch).to.be.equal(channel)
      expect(msg).to.be.equal(message)
      pubsub.unsubscribe(sub, channel, handler)
      done()
    }
    const expects = (err, msgs) => {
      expect(err).to.be.null
    }
    async.series([
      pubsub.subscribe.bind(null, sub, channel, handler),
      pubsub.publish.bind(null, pub, channel, message),
    ], expects)
  })

})

describe('Subscribe To Channel', () => {

  let sub, othersub, pub
  let channel = 'channel'
  let message = 'message'
  let nop = () => {}

  before(done => {
    sub = redis.createClient(0, 'localhost')
    othersub = redis.createClient(0, 'localhost')
    pub = redis.createClient(0, 'localhost')
    done()
  })

  after(done => {
    sub.quit()
    othersub.quit()
    pub.quit()
    done()
  })

  it('should not return an error when client is not null or undefined', (done) => {
    pubsub.subscribe(sub, channel, nop, (err, msg) => {
      expect(err).to.be.null
      pubsub.unsubscribe(sub, channel, nop)
      done()
    })
  })

  it('should return an error when client is undefined', (done) => {
    pubsub.subscribe(undefined, channel, nop, (err, msg) => {
      expect(err).to.not.be.null
      done()
    })
  })

  it('should return an error when client is null', (done) => {
    pubsub.subscribe(null, channel, nop, (err, msg) => {
      expect(err).to.not.be.null
      done()
    })
  })

  it('should allow parallel use of the same client', (done) => {
    const expects = (err, msgs) => {
      expect(err).to.be.null
      pubsub.unsubscribe(sub, channel, nop)
      pubsub.unsubscribe(sub, channel, nop)
      pubsub.unsubscribe(sub, channel, nop)
      pubsub.unsubscribe(sub, channel, nop)
      done()
    }
    async.parallel([
      pubsub.subscribe.bind(null, sub, channel, nop),
      pubsub.subscribe.bind(null, sub, channel, nop),
      pubsub.subscribe.bind(null, sub, channel, nop),
      pubsub.subscribe.bind(null, sub, channel, nop),
    ], expects)
  })

  it('should not return an error when handler is a function', (done) => {
    pubsub.subscribe(sub, channel, nop, (err, msg) => {
      expect(err).to.be.null
      done()
    })
  })

  it('should return an error when handler is not a function', (done) => {
    pubsub.subscribe(sub, channel, {}, (err, msg) => {
      expect(err).to.not.be.null
      done()
    })
  })

  it('should allow parallel use of the same handler', (done) => {
    const expects = (err, msgs) => {
      expect(err).to.be.null
      pubsub.unsubscribe(sub, channel, nop)
      pubsub.unsubscribe(sub, channel, nop)
      pubsub.unsubscribe(sub, channel, nop)
      pubsub.unsubscribe(sub, channel, nop)
      done()
    }
    async.parallel([
      pubsub.subscribe.bind(null, sub, channel, nop),
      pubsub.subscribe.bind(null, sub, channel, nop),
      pubsub.subscribe.bind(null, sub, channel, nop),
      pubsub.subscribe.bind(null, sub, channel, nop),
    ], expects)
  })

  it('should know 1 subscriber', (done) => {
    const expects = (err, msgs) => {
      expect(err).to.be.null
      expect(msgs[1]).to.be.equal(1)
      pubsub.unsubscribe(sub, channel, nop)
      done()
    }
    async.series([
      pubsub.subscribe.bind(null, sub, channel, nop),
      pubsub.publish.bind(null, pub, channel, message),
    ], expects)
  })

  it('should know 2 subscribers', (done) => {
    const expects = (err, msgs) => {
      expect(err).to.be.null
      expect(msgs[2]).to.be.equal(2)
      pubsub.unsubscribe(sub, channel, nop)
      pubsub.unsubscribe(othersub, channel, nop)
      done()
    }
    async.series([
      pubsub.subscribe.bind(null, sub, channel, nop),
      pubsub.subscribe.bind(null, othersub, channel, nop),
      pubsub.publish.bind(null, pub, channel, message),
    ], expects)
  })

  it('should receive published message', (done) => {
    let handler = (ch, msg) => {
      expect(ch).to.be.equal(channel)
      expect(msg).to.be.equal(message)
      pubsub.unsubscribe(sub, channel, handler)
      done()
    }
    const expects = (err, msgs) => {
      expect(err).to.be.null
    }
    async.series([
      pubsub.subscribe.bind(null, sub, channel, handler),
      pubsub.publish.bind(null, pub, channel, message),
    ], expects)
  })

})

})()
