import BaseClient from 'ganomede-base-client';
import { GetIndexEventsResult } from '../models/get-index-events-result';


export class IndexerClient extends BaseClient {

  secret?: string;
  pathPrefix: string;

  constructor({ protocol, hostname, port, pathnamePrefix, secret, agent }:
    { protocol: string, hostname: string, port: number, pathnamePrefix: string, secret?: string, agent?: string }) {
    super(`${protocol}://${hostname}:${port}${pathnamePrefix}`, { agent });
    this.pathPrefix = pathnamePrefix;
    this.secret = secret;
  }


  public set api(value: any) {
    super.api = value;
  }

  public get api(): any {
    return super.api;
  }

  createIndex(id: string, channel: string, field: string, callback: (e: Error, h: any) => void) {
    const body = Object.assign({
      id,
      secret: this.secret,
      channel,
      field
    }, {});

    super.apiCall({ method: 'post', path: '/indices', body }, callback);
  }

  getIndiceEvents(indexId: string, indexValue: string, callback: (err: Error, result: GetIndexEventsResult) => void) {
    const qs = Object.assign({
      secret: this.secret
    });
    super.apiCall({ method: 'get', path: `/indices/${indexId}/${indexValue}`, qs }, callback);
  }
}
