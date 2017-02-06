( () => {

'use strict'

const {expect} = require('chai')
const async = require('async')
const lodash = require('lodash')
const redis = require('fakeredis')
const store = require('../src/redis.store')

describe('Add Item', () => {

  let client
  let item = {}
  let group = 'group'
  let xform = (item, ndx) => {
    item.ndx = ndx
    return item
  }
  let resp = (item, ndx) => {
    return item
  }

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

  it('should not return an error when client is not null or undefined', (done) => {
    store.addItem(client, item, group, undefined, undefined, (err, msg) => {
      expect(err).to.be.null
      done()
    })
  })

  it('should return an error when client is undefined', (done) => {
    store.addItem(undefined, item, group, undefined, undefined, (err, msg) => {
      expect(err).to.not.be.null
      done()
    })
  })

  it('should return an error when client is null', (done) => {
    store.addItem(null, item, group, undefined, undefined, (err, msg) => {
      expect(err).to.not.be.null
      done()
    })
  })

  it('should allow parallel use of the same client', (done) => {
    client.flushdb()
    const expects = (err, ndxs) => {
      expect(err).to.be.null
      expect(ndxs[0].ndx)
        .to.not.equal(ndxs[1])
        .to.not.equal(ndxs[2])
        .to.not.equal(ndxs[3])
      expect(ndxs[1].ndx)
        .to.not.equal(ndxs[2])
        .to.not.equal(ndxs[3])
      expect(ndxs[2].ndx)
        .to.not.equal(ndxs[3])
      done()
    }
    async.parallel([
      store.addItem.bind(null, client, {}, group, undefined, undefined),
      store.addItem.bind(null, client, {}, group, undefined, undefined),
      store.addItem.bind(null, client, {}, group, undefined, undefined),
      store.addItem.bind(null, client, {}, group, undefined, undefined),
    ], expects)
  })

  it('should provide next index', (done) => {
    client.flushdb()
    const expects = (err, ndxs) => {
      expect(err).to.be.null
      expect(ndxs[1]).to.equal(ndxs[0] + 1)
      done()
    }
    async.series([
      store.addItem.bind(null, client, item, group, undefined, undefined),
      store.addItem.bind(null, client, item, group, undefined, undefined),
    ], expects)
  })

  it('should allow parallel use of the same item with transform', (done) => {
    client.flushdb()
    const expects = (err, ndxs) => {
      expect(err).to.be.null
      expect(ndxs[0].ndx)
        .to.not.equal(ndxs[1].ndx)
        .to.not.equal(ndxs[2].ndx)
        .to.not.equal(ndxs[3].ndx)
      expect(ndxs[1].ndx)
        .to.not.equal(ndxs[2].ndx)
        .to.not.equal(ndxs[3].ndx)
      expect(ndxs[2].ndx)
        .to.not.equal(ndxs[3].ndx)
      done()
    }
    async.parallel([
      store.addItem.bind(null, client, item, group, xform, resp),
      store.addItem.bind(null, client, item, group, xform, resp),
      store.addItem.bind(null, client, item, group, xform, resp),
      store.addItem.bind(null, client, item, group, xform, resp),
    ], expects)
  })

})

describe('Get Items', () => {

  let client
  let group = 'group'
  let start = 1
  let format = (item) => {
    item['id'] = parseInt(item['id'])
    item['timestamp'] = parseInt(item['timestamp'])
    return item
  }

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

  it('should not return an error when client is not null or undefined', (done) => {
    store.getItems(client, group, start, undefined, (err, msg) => {
      expect(err).to.be.null
      done()
    })
  })

  it('should return an error when client is undefined', (done) => {
    store.getItems(undefined, group, start, undefined, (err, msg) => {
      expect(err).to.not.be.null
      done()
    })
  })

  it('should return an error when client is null', (done) => {
    store.getItems(null, group, start, undefined, (err, msg) => {
      expect(err).to.not.be.null
      done()
    })
  })

})

})()
