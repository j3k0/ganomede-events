'use strict';

const Cursor = require('../../src/client/Cursor');

describe('Cursor', () => {
  describe('new Cursor()', () => {
    it('requires channel', () => {
      expect(() => new Cursor()).to.throw(/requires channel/);
    });

    it('defaults things', () => {
      expect(new Cursor('channel')).to.eql({
        channel: 'channel',
        after: null,
        limit: null
      });
    });

    it('accepts non-default things', () => {
      expect(new Cursor('channel', {limit: 50})).to.eql({
        channel: 'channel',
        after: null,
        limit: 50
      });
    });
  });

  describe('#advance()', () => {
    const start = new Cursor('channel');
    const events = [{id: 1}, {id: 5}, {id: 2}, {id: 3}];

    it('returns new cursror', () => {
      const next = start.advance(events);
      expect(next).to.be.instanceof(Cursor);
      expect(next).to.not.be.equal(start);
    });

    it('moves after to max event id', () => {
      expect(start.advance(events).after).to.equal(5);
    });

    it('advancing with empty or malformed array returns self', () => {
      expect(start.advance([])).to.equal(start);
      expect(start.advance([{}])).to.equal(start);
    });

    it('advancing with non-array returns self', () => {
      expect(start.advance(undefined)).to.equal(start);
      expect(start.advance(null)).to.equal(start);
      expect(start.advance(new Error())).to.equal(start);
    });
  });

  describe('#toQuery()', () => {
    it('includes channel', () => {
      expect(new Cursor('channel').toQuery()).to.eql({channel: 'channel'});
    });

    it('includes after if it is non-null', () => {
      expect(new Cursor('channel', {after: 40}).toQuery()).to.eql({
        channel: 'channel',
        after: 40
      });
    });

    it('includes limit if it is non-null', () => {
      expect(new Cursor('channel', {limit: 99}).toQuery()).to.eql({
        channel: 'channel',
        limit: 99
      });
    });

    it('includes all non-null things', () => {
      expect(new Cursor('channel', {after: 40, limit: 99}).toQuery()).to.eql({
        channel: 'channel',
        after: 40,
        limit: 99
      });
    });
  });
});
