( () => {

'use strict'

const {expect} = require('chai')
const async = require('async')
const redis = require('fakeredis')
const store = require('../src/events.store')

describe('Add Event', () => {

  let client
  let event = {}
  let channel = 'channel'

  before(done => {
    client = redis.createClient(0, 'localhost')
    client.flushdb()
    done()
  })

  after(done => {
    client.flushdb()
    client.quit()
    done()
  })

  it('should not return an error when event is not null or undefined', (done) => {
    store.addEvent(client, event, channel, (err, msg) => {
      expect(err).to.be.null
      done()
    })
  })

  it('should return an error when event is undefined', (done) => {
    store.addEvent(client, undefined, channel, (err, msg) => {
      expect(err).to.not.be.null
      done()
    })
  })

  it('should return an error when event is null', (done) => {
    store.addEvent(client, null, channel, (err, msg) => {
      expect(err).to.not.be.null
      done()
    })
  })

  it('should not return an error when channel is a string', (done) => {
    store.addEvent(client, event, channel, (err, msg) => {
      expect(err).to.be.null
      done()
    })
  })

  it('should return an error when channel is undefined', (done) => {
    store.addEvent(client, event, undefined, (err, msg) => {
      expect(err).to.not.be.null
      done()
    })
  })

  it('should return an error when channel is not a string', (done) => {
    store.addEvent(client, event, 0, (err, msg) => {
      expect(err).to.not.be.null
      done()
    })
  })

  it('should provide new ID', (done) => {
    client.flushdb()
    const expects = (err, ids) => {
      let id0 = ids[0].id
      let id1 = ids[1].id
      expect(id1).to.equal(id0 + 1)
      done()
    }
    async.series([
      store.addEvent.bind(null, client, event, channel),
      store.addEvent.bind(null, client, event, channel),
    ], expects)
  })

  it('should add events to an empty channel', (done) => {
    client.flushdb()
    const expects = (err, res) => {
      expect(res[2]).to.have.lengthOf(2)
      expect(res[2][0].id).to.equal(1)
      expect(res[2][1].id).to.equal(2)
      done()
    }
    async.series([
      store.addEvent.bind(null, client, event, channel),
      store.addEvent.bind(null, client, event, channel),
      store.getEventsAfterId.bind(null, client, channel, 0),
    ], expects)
  })

  it('should add events to separate channels', (done) => {
    client.flushdb()
    let diffch = 'diff/channel'
    const expects = (err, res) => {
      expect(res[2]).to.have.lengthOf(1)
      expect(res[2][0].id).to.equal(1)
      expect(res[3]).to.have.lengthOf(1)
      expect(res[3][0].id).to.equal(1)
      done()
    }
    async.series([
      store.addEvent.bind(null, client, event, channel),
      store.addEvent.bind(null, client, event, diffch),
      store.getEventsAfterId.bind(null, client, channel, 0),
      store.getEventsAfterId.bind(null, client, diffch, 0),
    ], expects)
  })

})


describe('Get Events', () => {

  let client
  let channel = 'channel'
  let afterId = 0
  let event = {}

  before(done => {
    client = redis.createClient(0, 'localhost')
    client.flushdb()
    done()
  })

  after(done => {
    client.flushdb()
    client.quit()
    done()
  })

  it('should not return an error when channel is a string', (done) => {
    store.getEventsAfterId(client, channel, afterId, (err, msg) => {
      expect(err).to.be.null
      done()
    })
  })

  it('should return an error when channel is undefined', (done) => {
    store.getEventsAfterId(client, undefined, afterId, (err, msg) => {
      expect(err).to.not.be.null
      done()
    })
  })

  it('should return an error when channel is not a string', (done) => {
    store.getEventsAfterId(client, 0, afterId, (err, msg) => {
      expect(err).to.not.be.null
      done()
    })
  })

  it('should not return an error when after ID is a number', (done) => {
    store.getEventsAfterId(client, channel, afterId, (err, msg) => {
      expect(err).to.be.null
      done()
    })
  })

  it('should not return an error when after ID is string parseable to number', (done) => {
    store.getEventsAfterId(client, channel, '1', (err, msg) => {
      expect(err).to.be.null
      done()
    })
  })

  it('should not return an error when after ID is undefined', (done) => {
    store.getEventsAfterId(client, channel, undefined, (err, msg) => {
      expect(err).to.be.null
      done()
    })
  })

  it('should return an error when after ID is not valid', (done) => {
    store.getEventsAfterId(client, channel, 'true', (err, msg) => {
      expect(err).to.not.be.null
      done()
    })
  })

  it('should return no event from empty channel', (done) => {
    client.flushdb()
    store.getEventsAfterId(client, channel, afterId, (err, events) => {
      expect(events).to.have.lengthOf(0)
      done()
    })
  })

  it('should return all events from a channel', (done) => {
    client.flushdb()
    const expects = (err, res) => {
      expect(res[2]).to.have.lengthOf(2)
      expect(res[2][0].id).to.equal(1)
      expect(res[2][1].id).to.equal(2)
      done()
    }
    async.series([
      store.addEvent.bind(null, client, event, channel),
      store.addEvent.bind(null, client, event, channel),
      store.getEventsAfterId.bind(null, client, channel, afterId),
    ], expects)
  })

  it('should return events only from own channel', (done) => {
    client.flushdb()
    let diffch = 'diff/channel'
    const expects = (err, res) => {
      expect(res[2]).to.have.lengthOf(1)
      expect(res[2][0].id).to.equal(1)
      done()
    }
    async.series([
      store.addEvent.bind(null, client, event, channel),
      store.addEvent.bind(null, client, event, diffch),
      store.getEventsAfterId.bind(null, client, channel, afterId),
    ], expects)
  })

  it('should return no event if after ID is equal to last event', (done) => {
    client.flushdb()
    const expects = (err, res) => {
      expect(res[3]).to.have.lengthOf(0)
      done()
    }
    async.series([
      store.addEvent.bind(null, client, event, channel),
      store.addEvent.bind(null, client, event, channel),
      store.addEvent.bind(null, client, event, channel),
      store.getEventsAfterId.bind(null, client, channel, 3),
    ], expects)
  })

  it('should return no event if after ID is beyond last event', (done) => {
    client.flushdb()
    const expects = (err, res) => {
      expect(res[3]).to.have.lengthOf(0)
      done()
    }
    async.series([
      store.addEvent.bind(null, client, event, channel),
      store.addEvent.bind(null, client, event, channel),
      store.addEvent.bind(null, client, event, channel),
      store.getEventsAfterId.bind(null, client, channel, 4),
    ], expects)
  })

  it('should return only events after the given ID', (done) => {
    client.flushdb()
    const expects = (err, res) => {
      expect(res[3]).to.have.lengthOf(2)
      expect(res[3][0].id).to.equal(2)
      expect(res[3][1].id).to.equal(3)
      done()
    }
    async.series([
      store.addEvent.bind(null, client, event, channel),
      store.addEvent.bind(null, client, event, channel),
      store.addEvent.bind(null, client, event, channel),
      store.getEventsAfterId.bind(null, client, channel, 1),
    ], expects)
  })

})

})()
