import { Cursor } from './Cursor';
import { JsonClient } from 'restify-clients';
import BaseClient from 'ganomede-base-client';


// export declare module GanomedeBaseClient{
//   class BaseClient {
//      api: JsonClient;
//      apiCall: (parameters: any, callback)=>void;

//      constructor(baseUrl: string, optionsOverwrites?: any);
//  }
// }

export class EventsClient extends BaseClient {

  clientId: string;
  secret: string;
  pathPrefix: string;

  constructor({ protocol, hostname, port, pathnamePrefix, clientId, secret, agent }:
    { protocol: string, hostname: string, port: number, pathnamePrefix: string, clientId: string, secret: string, agent?: string }) {
    super(`${protocol}://${hostname}:${port}${pathnamePrefix}`, { agent });
    this.pathPrefix = pathnamePrefix;
    this.clientId = clientId;
    this.secret = secret;
  }


  public set api(value: any) {
    super.api = value;
  }

  public get api(): any {
    return super.api;
  }

  getEvents(cursor: Cursor, callback: (err: Error, events: []) => void) {
    const qs = Object.assign(cursor.toQuery(), {
      clientId: this.clientId,
      secret: this.secret
    });
    super.apiCall({ method: 'get', path: '/events', qs }, callback);
  }

  sendEvent(channel: string, event: any, callback: (e: Error, h: any) => void) {
    const body = Object.assign({
      clientId: this.clientId,
      secret: this.secret,
      channel
    }, event);

    super.apiCall({ method: 'post', path: '/events', body }, callback);
  }

  getLatestEvents(channel: string, limit: number = 100, callback: (err: Error, events: []) => void) {
    const qs = Object.assign({
      channel,
      limit,
      secret: this.secret
    });
    super.apiCall({ method: 'get', path: '/latest', qs }, callback);
  }
}
