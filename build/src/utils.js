'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.debug = exports.addOne = exports.nopIfNotFunction = exports.defaultIfNotFunction = exports.zeroIfNaN = exports.objectToString = exports.stringToObject = exports.customCallback = exports.messageCallback = exports.loggingCallback = void 0;
const logger = require('./logger');
// Callbacks
const loggingCallback = (callback, error, message) => {
    error && logger['error'](error);
    typeof callback === 'function' && callback(error, message);
};
exports.loggingCallback = loggingCallback;
const messageCallback = (callback, error, message) => callback && callback(error, message);
exports.messageCallback = messageCallback;
const customCallback = (callback, custom, error) => {
    typeof callback === 'function' && callback(error, custom);
};
exports.customCallback = customCallback;
// Transforms
const stringToObject = (data) => {
    return typeof data === 'string' ? JSON.parse(data) : data;
};
exports.stringToObject = stringToObject;
const objectToString = (data) => {
    return typeof data === 'object' ? JSON.stringify(data) : data;
};
exports.objectToString = objectToString;
const zeroIfNaN = (data) => {
    const intdata = parseInt(data);
    return isNaN(intdata) ? 0 : intdata;
};
exports.zeroIfNaN = zeroIfNaN;
const defaultIfNotFunction = (data, def) => {
    return typeof data === 'function' ? data : def;
};
exports.defaultIfNotFunction = defaultIfNotFunction;
const nopIfNotFunction = (data) => {
    return (0, exports.defaultIfNotFunction)(data, () => { });
};
exports.nopIfNotFunction = nopIfNotFunction;
const addOne = (data) => {
    return data !== undefined ? (0, exports.zeroIfNaN)(data) + 1 : 1;
};
exports.addOne = addOne;
const debug = (func, label) => (...args) => {
    /* eslint-disable no-console */
    console.log('calling ' + (label || func.name) + ' with arguments:');
    console.log(args);
    /* eslint-enable no-console */
    return func.apply(this, args);
};
exports.debug = debug;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7QUFFWCxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7QUFFckMsWUFBWTtBQUNILE1BQU0sZUFBZSxHQUFHLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsRUFBRTtJQUMxRCxLQUFLLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2hDLE9BQU8sUUFBUSxLQUFLLFVBQVUsSUFBSSxRQUFRLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQzdELENBQUMsQ0FBQztBQUhXLFFBQUEsZUFBZSxtQkFHMUI7QUFFSyxNQUFNLGVBQWUsR0FBRyxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUUsQ0FDNUQsUUFBUSxJQUFJLFFBQVEsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFEeEIsUUFBQSxlQUFlLG1CQUNTO0FBRTlCLE1BQU0sY0FBYyxHQUFHLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsRUFBRTtJQUN4RCxPQUFPLFFBQVEsS0FBSyxVQUFVLElBQUksUUFBUSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztBQUM1RCxDQUFDLENBQUM7QUFGVyxRQUFBLGNBQWMsa0JBRXpCO0FBRUosYUFBYTtBQUNKLE1BQU0sY0FBYyxHQUFHLENBQUMsSUFBSSxFQUFFLEVBQUU7SUFDckMsT0FBTyxPQUFPLElBQUksS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztBQUM1RCxDQUFDLENBQUM7QUFGVyxRQUFBLGNBQWMsa0JBRXpCO0FBRUssTUFBTSxjQUFjLEdBQUcsQ0FBQyxJQUFJLEVBQUUsRUFBRTtJQUNyQyxPQUFPLE9BQU8sSUFBSSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0FBQ2hFLENBQUMsQ0FBQztBQUZXLFFBQUEsY0FBYyxrQkFFekI7QUFFSyxNQUFNLFNBQVMsR0FBRyxDQUFDLElBQUksRUFBRSxFQUFFO0lBQ2hDLE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMvQixPQUFPLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7QUFDdEMsQ0FBQyxDQUFDO0FBSFcsUUFBQSxTQUFTLGFBR3BCO0FBRUssTUFBTSxvQkFBb0IsR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsRUFBRTtJQUNoRCxPQUFPLE9BQU8sSUFBSSxLQUFLLFVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7QUFDakQsQ0FBQyxDQUFDO0FBRlcsUUFBQSxvQkFBb0Isd0JBRS9CO0FBRUssTUFBTSxnQkFBZ0IsR0FBRyxDQUFDLElBQUksRUFBRSxFQUFFO0lBQ3ZDLE9BQU8sSUFBQSw0QkFBb0IsRUFBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLEdBQUUsQ0FBQyxDQUFDLENBQUM7QUFDOUMsQ0FBQyxDQUFDO0FBRlcsUUFBQSxnQkFBZ0Isb0JBRTNCO0FBRUssTUFBTSxNQUFNLEdBQUcsQ0FBQyxJQUFJLEVBQUUsRUFBRTtJQUM3QixPQUFPLElBQUksS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUEsaUJBQVMsRUFBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN0RCxDQUFDLENBQUM7QUFGVyxRQUFBLE1BQU0sVUFFakI7QUFFSyxNQUFNLEtBQUssR0FBRyxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLEVBQUUsRUFBRTtJQUNoRCwrQkFBK0I7SUFDL0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEdBQUcsQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLGtCQUFrQixDQUFDLENBQUM7SUFDcEUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNsQiw4QkFBOEI7SUFDOUIsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztBQUNoQyxDQUFDLENBQUM7QUFOVyxRQUFBLEtBQUssU0FNaEIifQ==