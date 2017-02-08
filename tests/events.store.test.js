const {expect} = require('chai')
const async = require('async')
const redis = require('fakeredis')
const store = require('../src/events.store')
const utils = require('../src/utils')

describe('events.store', () => {

let redisClient
const event = {}
const afterId = 0
const channel = 'channel'

const formatEvent = (item) => item

const addEvent = (callback, channel = 'channel') =>
  store.addEvent(redisClient, event, channel, callback)

const getAllEvents = (callback, channel = 'channel') =>
  store.getEventsAfterId(redisClient, channel, 0, callback)

beforeEach(done => {
  redisClient = redis.createClient(0, 'localhost')
  redisClient.flushdb(done)
})

afterEach(done => {
  redisClient.flushdb(() => {
    redisClient.quit()
    done()
  })
})

describe('Add Event', () => {

  it('should succeed when event is defined', (done) => {
    store.addEvent(redisClient, event, channel, (err, msg) => {
      expect(err).to.be.null
      done()
    })
  })

  it('should return an error when event is undefined', (done) => {
    store.addEvent(redisClient, undefined, channel, (err, msg) => {
      expect(err).to.not.be.null
      done()
    })
  })

  it('should return an error when event is null', (done) => {
    store.addEvent(redisClient, null, channel, (err, msg) => {
      expect(err).to.not.be.null
      done()
    })
  })

  it('should succeed when channel is a string', (done) => {
    store.addEvent(redisClient, event, channel, (err, msg) => {
      expect(err).to.be.null
      done()
    })
  })

  it('should return an error when channel is undefined', (done) => {
    store.addEvent(redisClient, event, undefined, (err, msg) => {
      expect(err).to.not.be.null
      done()
    })
  })

  it('should return an error when channel is not a string', (done) => {
    store.addEvent(redisClient, event, 0, (err, msg) => {
      expect(err).to.not.be.null
      done()
    })
  })

  it('should provide new IDs', (done) => {
    const expects = (err, ids) => {
      const id0 = ids[0].id
      const id1 = ids[1].id
      expect(id0).to.equal(1)
      expect(id1).to.equal(2)
      done()
    }

    async.series([ addEvent, addEvent ], expects)
  })

  it('should add events to an empty channel', (done) => {
    const expects = (err, res) => {
      const events = res[2].map(formatEvent)
      expect(events).to.have.lengthOf(2)
      expect(events[0].id).to.equal(1)
      expect(events[1].id).to.equal(2)
      done()
    }

    async.series([ addEvent, addEvent, getAllEvents ], expects)
  })

  it('should add events to separate channels', (done) => {
    let diffch = 'diff/channel'
    const expects = (err, res) => {
      const events = res[2]
      const otherEvents = res[3]
      expect(events).to.have.lengthOf(1)
      expect(events[0].id).to.equal(1)
      expect(otherEvents).to.have.lengthOf(1)
      expect(otherEvents[0].id).to.equal(1)
      done()
    }
    async.series([
      store.addEvent.bind(null, redisClient, event, channel),
      store.addEvent.bind(null, redisClient, event, diffch),
      store.getEventsAfterId.bind(null, redisClient, channel, 0),
      store.getEventsAfterId.bind(null, redisClient, diffch, 0),
    ], expects)
  })

})


describe('Get Events', () => {

  it('should not return an error when channel is a string', (done) => {
    store.getEventsAfterId(redisClient, channel, afterId, (err, msg) => {
      expect(err).to.be.null
      done()
    })
  })

  it('should return an error when channel is undefined', (done) => {
    store.getEventsAfterId(redisClient, undefined, afterId, (err, msg) => {
      expect(err).to.not.be.null
      done()
    })
  })

  it('should return an error when channel is not a string', (done) => {
    store.getEventsAfterId(redisClient, 0, afterId, (err, msg) => {
      expect(err).to.not.be.null
      done()
    })
  })

  it('should not return an error when after ID is a number', (done) => {
    store.getEventsAfterId(redisClient, channel, afterId, (err, msg) => {
      expect(err).to.be.null
      done()
    })
  })

  it('should not return an error when after ID is string parseable to number', (done) => {
    store.getEventsAfterId(redisClient, channel, '1', (err, msg) => {
      expect(err).to.be.null
      done()
    })
  })

  it('should not return an error when after ID is undefined', (done) => {
    store.getEventsAfterId(redisClient, channel, undefined, (err, msg) => {
      expect(err).to.be.null
      done()
    })
  })

  it('should return an error when after ID is not valid', (done) => {
    store.getEventsAfterId(redisClient, channel, 'true', (err, msg) => {
      expect(err).to.not.be.null
      done()
    })
  })

  it('should return no event from empty channel', (done) => {
    store.getEventsAfterId(redisClient, channel, afterId, (err, events) => {
      expect(events).to.have.lengthOf(0)
      done()
    })
  })

  it('should return all events from a channel', (done) => {
    const expects = (err, res) => {
      const events = res[2].map(formatEvent)
      expect(events).to.have.lengthOf(2)
      expect(events[0].id).to.equal(1)
      expect(events[1].id).to.equal(2)
      done()
    }
    async.series([
      store.addEvent.bind(null, redisClient, event, channel),
      store.addEvent.bind(null, redisClient, event, channel),
      store.getEventsAfterId.bind(null, redisClient, channel, afterId),
    ], expects)
  })

  it('should return events only from own channel', (done) => {
    const otherChannel = 'diff/channel'
    const expects = (err, res) => {
      const events = res[2].map(formatEvent)
      expect(events).to.have.lengthOf(1)
      expect(events[0].id).to.equal(1)
      done()
    }
    async.series([
      store.addEvent.bind(null, redisClient, event, channel),
      store.addEvent.bind(null, redisClient, event, otherChannel),
      store.getEventsAfterId.bind(null, redisClient, channel, afterId),
    ], expects)
  })

  it('should return no event if after ID is equal to last event', (done) => {
    const expects = (err, res) => {
      const events = res[3]
      expect(events).to.have.lengthOf(0)
      done()
    }
    async.series([
      store.addEvent.bind(null, redisClient, event, channel),
      store.addEvent.bind(null, redisClient, event, channel),
      store.addEvent.bind(null, redisClient, event, channel),
      store.getEventsAfterId.bind(null, redisClient, channel, 3),
    ], expects)
  })

  it('should return no event if after ID is beyond last event', (done) => {
    const expects = (err, res) => {
      expect(res[3]).to.have.lengthOf(0)
      done()
    }
    async.series([
      store.addEvent.bind(null, redisClient, event, channel),
      store.addEvent.bind(null, redisClient, event, channel),
      store.addEvent.bind(null, redisClient, event, channel),
      store.getEventsAfterId.bind(null, redisClient, channel, 4),
    ], expects)
  })

  it('should return only events after the given ID', (done) => {
    const expects = (err, res) => {
      const events = res[3]
      expect(events).to.have.lengthOf(2)
      expect(events[0].id).to.equal(2)
      expect(events[1].id).to.equal(3)
      done()
    }
    async.series([
      store.addEvent.bind(null, redisClient, event, channel),
      store.addEvent.bind(null, redisClient, event, channel),
      store.addEvent.bind(null, redisClient, event, channel),
      store.getEventsAfterId.bind(null, redisClient, channel, 1),
    ], expects)
  })

})
})
