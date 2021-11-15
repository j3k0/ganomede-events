'use strict';

import {expect} from 'chai';
import supertest from 'supertest';
import {createServer} from '../src/server';
import {createAbout} from '../src/about.router';
import {config} from '../config';
import pkg from '../package.json';

const about = createAbout;

describe('about-router', () => {
  const server = createServer();

  before(done => {
    about(config.http.prefix, server);
    server.listen(done);
  });

  after(done => server.close(done));

  const test = (url) => {
    it(`GET ${url}`, (done) => {
      supertest(server)
        .get(url)
        .expect(200)
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res.body).to.have.property('type', pkg.name);
          done();
        });
    });
  };

  test('/about');
  test(`${config.http.prefix}/about`);
});
