'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const createPoll = ({ pubsub, log = require('./logger'), pollTimeout = (0, utils_1.zeroIfNaN)(require('../config').pollTimeout), setTimeout = global.setTimeout, clearTimeout = global.clearTimeout }) => {
    const logError = (err) => err && log.error(err);
    const listen = (channel, callback) => {
        const done = (err, message) => {
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
            if (handler) {
                pubsub.unsubscribe(channel, handler, logError);
                handler = null;
            }
            if (callback) {
                const cb = callback;
                callback = null;
                cb(err, message);
            }
        };
        const timeout = () => done(null, null);
        let timeoutId = setTimeout(timeout, pollTimeout);
        let handler = (message) => done(null, message);
        pubsub.subscribe(channel, handler, logError);
    };
    const emit = (channel, message, callback) => {
        pubsub.publish(channel, message, callback);
    };
    return { listen, emit };
};
module.exports = { createPoll };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9sbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9wb2xsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7QUFFYixtQ0FBa0M7QUFFbEMsTUFBTSxVQUFVLEdBQUcsQ0FBQyxFQUNsQixNQUFNLEVBQ04sR0FBRyxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFDekIsV0FBVyxHQUFHLElBQUEsaUJBQVMsRUFBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUMsV0FBVyxDQUFDLEVBQ3pELFVBQVUsR0FBRyxNQUFNLENBQUMsVUFBVSxFQUM5QixZQUFZLEdBQUcsTUFBTSxDQUFDLFlBQVksRUFDbkMsRUFBRSxFQUFFO0lBRUgsTUFBTSxRQUFRLEdBQUcsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBRWhELE1BQU0sTUFBTSxHQUFHLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxFQUFFO1FBRW5DLE1BQU0sSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLE9BQU8sRUFBRSxFQUFFO1lBQzVCLElBQUksU0FBUyxFQUFFO2dCQUNiLFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDeEIsU0FBUyxHQUFHLElBQUksQ0FBQzthQUNsQjtZQUNELElBQUksT0FBTyxFQUFFO2dCQUNYLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDL0MsT0FBTyxHQUFHLElBQUksQ0FBQzthQUNoQjtZQUNELElBQUksUUFBUSxFQUFFO2dCQUNaLE1BQU0sRUFBRSxHQUFHLFFBQVEsQ0FBQztnQkFDcEIsUUFBUSxHQUFHLElBQUksQ0FBQztnQkFDaEIsRUFBRSxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQzthQUNsQjtRQUNILENBQUMsQ0FBQztRQUVGLE1BQU0sT0FBTyxHQUFHLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDdkMsSUFBSSxTQUFTLEdBQTBDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDeEYsSUFBSSxPQUFPLEdBQW1DLENBQUMsT0FBWSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ3BGLE1BQU0sQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztJQUMvQyxDQUFDLENBQUM7SUFFRixNQUFNLElBQUksR0FBRyxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLEVBQUU7UUFDMUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQzdDLENBQUMsQ0FBQztJQUVGLE9BQU8sRUFBQyxNQUFNLEVBQUUsSUFBSSxFQUFDLENBQUM7QUFDeEIsQ0FBQyxDQUFDO0FBRUYsTUFBTSxDQUFDLE9BQU8sR0FBRyxFQUFDLFVBQVUsRUFBQyxDQUFDIn0=