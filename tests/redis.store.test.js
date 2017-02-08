const {expect} = require('chai')
const async = require('async')
const lodash = require('lodash')
const redis = require('fakeredis')
const store = require('../src/redis.store')
const utils = require('../src/utils')
const first  = (a, b) => a
const second = (a, b) => b

describe('redis.store', () => {

let redisClient
const item = {}
const DEFAULT_GROUP = group = 'group'

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

const itemFactory = (data, index) =>
  Object.assign({}, data, { index })

const addItem = (callback) => 
  store.addItem(redisClient, item, group, itemFactory, callback)

describe('Add Item', () => {

  it('should return an error when redisClient is undefined', (done) => {
    store.addItem(undefined, item, group, undefined, (err, msg) => {
      expect(err).to.not.be.null
      done()
    })
  })

  it('should return an error when redisClient is null', (done) => {
    store.addItem(null, item, group, undefined, (err, msg) => {
      expect(err).to.not.be.null
      done()
    })
  })

  it('should succeed when redisClient is defined', (done) => {
    store.addItem(redisClient, item, group, undefined, (err, msg) => {
      expect(err).to.be.null
      done()
    })
  })

  it('should allow parallel use of the same redisClient', (done) => {
    const expects = (err, indices) => {
      expect(err).to.be.null
      expect(indices[0].index)
        .to.not.equal(indices[1])
        .to.not.equal(indices[2])
        .to.not.equal(indices[3])
      expect(indices[1].index)
        .to.not.equal(indices[2])
        .to.not.equal(indices[3])
      expect(indices[2].index)
        .to.not.equal(indices[3])
      done()
    }
    async.parallel([ addItem, addItem, addItem, addItem ], expects)
  })

  it('should provide next index', (done) => {
    const expects = (err, indices) => {
      expect(err).to.be.null
      expect(indices[1].index).to.equal(indices[0].index + 1)
      done()
    }
    const getIndex = second
    async.series([ addItem, addItem ], expects)
  })

  it('should allow parallel use of the same item with transform', (done) => {

    const expects = (err, indices) => {
      expect(err).to.be.null
      expect(indices[0])
        .to.not.equal(indices[1])
        .to.not.equal(indices[2])
        .to.not.equal(indices[3])
      expect(indices[1])
        .to.not.equal(indices[2])
        .to.not.equal(indices[3])
      expect(indices[2])
        .to.not.equal(indices[3])
      done()
    }

    const getIndex = second
    async.parallel([ addItem, addItem, addItem, addItem ], expects)
  })

})

describe('Get Items', () => {

  let start = 1
  let format = (item) => {
    item['id'] = parseInt(item['id'])
    item['timestamp'] = parseInt(item['timestamp'])
    return item
  }

  it('should return an error when redisClient is undefined', (done) => {
    store.getItems(undefined, group, start, (err, msg) => {
      expect(err).to.not.be.null
      done()
    })
  })

  it('should return an error when redisClient is null', (done) => {
    store.getItems(null, group, start, (err, msg) => {
      expect(err).to.not.be.null
      done()
    })
  })

  it('should succeed when redisClient is defined', (done) => {
    store.getItems(redisClient, group, start, (err, msg) => {
      expect(err).to.be.null
      done()
    })
  })

})
})
