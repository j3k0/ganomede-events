
import restify, { Next as NextFunction } from 'restify';
import { requireAuth, requireSecret } from '../src/middlewares';
import { expect } from 'chai';
import td from 'testdouble';

interface IauthdbClient {
  getAccount(token: string, cb?: (err: Error, redisResult: any) => void): void;
}

describe('Middlewares', () => {
  describe('requireSecret()', () => {
    it('calls next() if req.ganomede.secretMatches', (done) => {
      requireSecret({ ganomede: { secretMatches: true } } as any, {} as any, done as NextFunction);
    });

    it('calls next(error) if secret was not matched', (done) => {
      requireSecret({ ganomede: { secretMatches: false } } as any, {} as any, ((err) => {
        expect(err).to.be.instanceof(restify.RestError);
        expect(err).to.have.property('restCode', 'InvalidCredentialsError');
        done();
      }) as NextFunction);
    });
  });

  describe('requireAuth()', () => {
    const authdbClient = td.object<IauthdbClient>(null as any);// td.object(['getAccount']);
    const mw = requireAuth({ authdbClient, secret: '42' });

    it('token is valid', (done) => {
      const req = {
        params: { token: 'token' },
        ganomede: {}
      };

      td.when(authdbClient.getAccount('token', td.callback))
        .thenCallback(null, 'user');

      mw(req as any, {} as any, ((err) => {
        expect(err).to.not.be.ok;
        expect(req.ganomede).to.have.property('userId', 'user');
        expect(req.ganomede).to.not.have.property('secretMatches');
        done();
      }) as NextFunction);
    });

    it('spoofing secret is valid', (done) => {
      const req = {
        params: { token: '42.user' },
        ganomede: {}
      };

      mw(req as any, {} as any, ((err) => {
        expect(err).to.not.be.ok;
        expect(req.ganomede).to.have.property('userId', 'user');
        expect(req.ganomede).to.have.property('secretMatches', true);
        done();
      }) as NextFunction);
    });

    it('token is invalid', (done) => {
      const req = {
        params: { token: 'oops' },
        ganomede: {}
      };

      td.when(authdbClient.getAccount('oops', td.callback))
        .thenCallback(null, null);

      mw(req as any, {} as any, ((err) => {
        expect(err).to.be.instanceof(restify.RestError);
        expect(err).to.have.property('restCode', 'InvalidCredentialsError');
        expect(req.ganomede).to.not.have.property('secretMatches');
        done();
      }) as NextFunction);
    });

    it('spoofing secret is invalid', (done) => {
      const req = {
        params: { token: 'not-42.oops' },
        ganomede: {}
      };

      td.when(authdbClient.getAccount('not-42.oops'))
        .thenCallback(null, null);

      mw(req as any, {} as any, ((err) => {
        expect(err).to.be.instanceof(restify.RestError);
        expect(err).to.have.property('restCode', 'InvalidCredentialsError');
        expect(req.ganomede).to.not.have.property('secretMatches');
        done();
      }) as NextFunction);
    });

    it('token is missing', (done) => {
      mw({ params: Object.create(null) } as any, {} as any, ((err) => {
        expect(err).to.be.instanceof(restify.RestError);
        expect(err).to.have.property('restCode', 'InvalidAuthTokenError');
        done();
      }) as NextFunction);
    });
  });
});
