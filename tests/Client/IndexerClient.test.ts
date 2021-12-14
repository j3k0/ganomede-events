
import { expect } from 'chai';
import td from 'testdouble';
import { IndexerClient } from '../../src/client/IndexerClient';
import { GetIndexEventsResult } from '../../src/models/get-index-events-result';

const INDEX_ID = 'blocked-users-by-username';
const INDEX_VALUE = 'value-OfIndex';
const SOME_CHANNEL = 'users/v1/blocked-users';

const CREATE_INDEX_REQ_BODY = {
  id: INDEX_ID,
  channel: SOME_CHANNEL,
  field: "data.username"
};

describe('IndexerClient', () => {
  const createClient = () => new IndexerClient({
    protocol: 'http',
    hostname: 'example.com',
    port: 80,
    pathnamePrefix: '/events/v1',
    secret: 'api_secret'
  });

  it('get events from an index', (done) => {
    const client = createClient();
    const validPath = td.matchers.contains({
      path: `/events/v1/indices/${INDEX_ID}/${INDEX_VALUE}?secret=api_secret`
    });
    const getIndiceEventsRes: GetIndexEventsResult = {
      field: CREATE_INDEX_REQ_BODY.field,
      id: CREATE_INDEX_REQ_BODY.id,
      value: INDEX_VALUE,
      rows: []
    };

    td.replace(client.api, 'get', td.function());

    td.when(client.api.get(validPath, td.matchers.anything()))
      .thenDo((path, cb: (e: Error | null, req, res, obj: any) => void) => {
        cb(null, null, null, getIndiceEventsRes);
      });

    client.getIndexEvents(INDEX_ID, INDEX_VALUE, (err, res) => {
      expect(err).to.be.null;
      expect(res).to.equal(getIndiceEventsRes);
      done();
    });
  });


  const reply = "OK";

  it('create an index', (done) => {
    const client = createClient();
    const expectedPath = td.matchers.contains({ path: '/events/v1/indices' });
    const expectedBody =
      Object.assign({
        secret: 'api_secret',
      }, CREATE_INDEX_REQ_BODY);

    td.replace(client.api, 'post', td.function());

    td.when(client.api.post(expectedPath, expectedBody, td.matchers.anything()))
      .thenDo((path, body, cb: (e: Error | null, req, res, obj: any) => void) => {
        cb(null, null, null, reply);
      });

    client.createIndex(CREATE_INDEX_REQ_BODY.id, CREATE_INDEX_REQ_BODY.channel, CREATE_INDEX_REQ_BODY.field, (err, header) => {
      expect(err).to.be.null;
      expect(header).to.eql(reply);
      done();
    });
  });
});
