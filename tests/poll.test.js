( () => {

'use strict'

const {expect} = require('chai')
const async = require('async')
const redis = require('fakeredis')
const poll = require('../src/poll')

describe('Add Polling', () => {

  let pub, sub
  let delay = 300
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

  it('should be triggerable', (done) => {
    const expects = (err, msgs) => {
      expect(err).to.be.null
    }
    const trigger = (ch, msg, clear) => {
      expect(ch).to.be.equal(channel)
      expect(msg).to.be.equal(message)
      clear()
      done()
    }
    const timeout = (unsub) => {
      expect(unsub).to.be.null // should not be here
      unsub()
      done()
    }
    async.series([
      poll.add.bind(null, sub, channel, delay, trigger, timeout),
      poll.trigger.bind(null, pub, channel, message),
    ], expects)
  })

  it('should timeout', (done) => {
    const sleep = (ms) => {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
    const expects = (err, msgs) => {
      expect(err).to.be.null
    }
    const trigger = (ch, msg, clear) => {
      expect(clear).to.be.null // should not be here
      clear()
      done()
    }
    const timeout = (unsub) => {
      unsub()
      done()
    }
    async.series([
      poll.add.bind(null, sub, channel, delay, trigger, timeout),
      sleep.bind(null, delay),
      poll.trigger.bind(null, pub, channel, message),
    ], expects)
  })

})

})()
