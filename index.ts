'use strict';

if (!module.parent) {
  const main = require('./src/main');
  main();
}

// module.exports = {
//   Client: require('./src/client/Client')
// };

export { Client } from './src/client/Client';
