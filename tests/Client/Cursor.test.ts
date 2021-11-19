
import {Cursor} from '../../src/client/Cursor';
import {expect} from 'chai';

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
      expect(new Cursor('channel', {limit: 50 as any})).to.eql({
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
      expect(start.advance([] as any)).to.equal(start);
      expect(start.advance([{}] as any)).to.equal(start);
    });

    it('advancing with non-array returns self', () => {
      expect(start.advance(undefined as any)).to.equal(start);
      expect(start.advance(null as any)).to.equal(start);
      expect(start.advance(new Error() as any)).to.equal(start);
    });
  });

  describe('#toQuery()', () => {
    it('includes channel', () => {
      expect(new Cursor('channel').toQuery()).to.eql({channel: 'channel'});
    });

    it('includes after if it is non-null', () => {
      expect(new Cursor('channel', {after: 40 as any}).toQuery()).to.eql({
        channel: 'channel',
        after: 40
      });
    });

    it('includes limit if it is non-null', () => {
      expect(new Cursor('channel', {limit: 99 as any}).toQuery()).to.eql({
        channel: 'channel',
        limit: 99
      });
    });

    it('includes all non-null things', () => {
      expect(new Cursor('channel', {after: 40 as any, limit: 99 as any}).toQuery()).to.eql({
        channel: 'channel',
        after: 40,
        limit: 99
      });
    });
  });
});
