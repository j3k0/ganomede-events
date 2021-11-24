/// <reference types="ganomede-base-client" />
 
import {JsonClient} from 'restify-clients';
 
declare module 'ganomede-base-client'{
   class BaseClient {
      api: JsonClient;
      apiCall: (parameters: any, callback)=>void;

      constructor(baseUrl: string, optionsOverwrites?: any);
  }
}