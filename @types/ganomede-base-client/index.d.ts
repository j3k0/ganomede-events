import {JsonClient} from 'restify-clients'
export = BaseClient;
declare class BaseClient {
    static parseConstructorOptions(baseUrl: any, optionsOverwrites: any): {
        pathPrefix: string;
        apiOptions: any;
    };
    constructor(baseUrl: any, optionsOverwrites?: {});
    pathPrefix: string;
    api: JsonClient;
    _checkArgs({ method, path, headers, body, qs }: {
        method: any;
        path: any;
        headers: any;
        body: any;
        qs: any;
    }): void;
    _extendedHeaders({ body, qs }: {
        body: any;
        qs: any;
    }): {
        'x-request-id': any;
    } | {
        'x-request-id'?: undefined;
    };
    apiCall({ method, path, headers, body, qs }: {
        method: any;
        path: any;
        headers?: {};
        body?: any;
        qs?: any;
    }, callback: any): any;
}
declare namespace BaseClient {
    export namespace defaultOptions {
        namespace retry {
            const minTimeout: any;
            const maxTimeout: any;
            const retries: number;
        }
        const headers: {
            accept: string;
            'accept-encoding': string;
        };
    }
    export { RequestSpecError };
}
declare class RequestSpecError {
}
