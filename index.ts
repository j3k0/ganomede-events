'use strict';

if (!module.parent) {
  const main = require('./src/main');
  main();
}

// module.exports = {
//   Client: require('./src/client/Client')
// };

export { Client } from './src/client/Client';
export { IndexerClient } from './src/client/IndexerClient';
export { GetIndexEventsResult} from './src/models/get-index-events-result';
