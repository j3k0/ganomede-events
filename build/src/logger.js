'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const bunyan = require('bunyan');
const config_1 = require("../config");
module.exports = bunyan.createLogger({
    level: config_1.config.logLevel,
    name: config_1.config.name
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2xvZ2dlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7O0FBRWIsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ2pDLHNDQUFpQztBQUVqQyxNQUFNLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUM7SUFDbkMsS0FBSyxFQUFFLGVBQU0sQ0FBQyxRQUFRO0lBQ3RCLElBQUksRUFBRSxlQUFNLENBQUMsSUFBSTtDQUNsQixDQUFDLENBQUMifQ==