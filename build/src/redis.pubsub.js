'use strict';
const errors = {
    invalidMessage: 'invalid message',
    invalidClient: 'invalid redisClient',
    invalidHandler: 'invalid handler'
};
const createPubSub = ({ redisPubClient, redisSubClient }) => {
    const isValidClient = (redisClient) => typeof redisClient === 'object' && redisClient !== null;
    if (!isValidClient(redisPubClient) || !isValidClient(redisSubClient))
        throw new Error(errors.invalidClient);
    const isValidMessage = (msg) => (typeof msg === 'number' ||
        typeof msg === 'string' ||
        typeof msg === 'object' && msg instanceof Buffer);
    const isValidHandler = (hndlr) => typeof hndlr === 'function';
    // List of handlers for each channel
    const channelHandlers = {};
    const addChannelHandler = (channel, handler) => {
        let handlers = channelHandlers[channel];
        if (!handlers)
            handlers = channelHandlers[channel] = [];
        handlers.push(handler);
    };
    const removeChannelHandler = (channel, handler) => {
        const handlers = channelHandlers[channel];
        const index = handlers.indexOf(handler);
        if (index >= 0)
            handlers.splice(index, 1);
    };
    const getChannelHandlers = (channel) => channelHandlers[channel] || [];
    // Listen for messages
    redisSubClient.on('message', (channel, message) => {
        getChannelHandlers(channel).forEach((handler) => handler(message));
    });
    // Are we already susbscribed to a given channel
    const isSubscribed = {};
    return {
        publish: (channel, message, cb) => {
            if (!isValidMessage(message))
                return cb(new Error(errors.invalidMessage));
            redisPubClient.publish(channel, message, cb);
        },
        subscribe: (channel, handler, cb) => {
            if (!isValidHandler(handler))
                return cb(new Error(errors.invalidHandler));
            addChannelHandler(channel, handler);
            if (!isSubscribed[channel]) {
                isSubscribed[channel] = true;
                redisSubClient.subscribe(channel, cb);
            }
            else {
                cb(null);
            }
        },
        unsubscribe: (channel, handler, cb) => {
            if (!isValidHandler(handler))
                return cb(new Error(errors.invalidHandler));
            removeChannelHandler(channel, handler);
            cb(null);
        }
    };
};
module.exports = {
    errors,
    createPubSub
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVkaXMucHVic3ViLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3JlZGlzLnB1YnN1Yi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7QUFFYixNQUFNLE1BQU0sR0FBRztJQUNiLGNBQWMsRUFBRSxpQkFBaUI7SUFDakMsYUFBYSxFQUFFLHFCQUFxQjtJQUNwQyxjQUFjLEVBQUUsaUJBQWlCO0NBQ2xDLENBQUM7QUFFRixNQUFNLFlBQVksR0FBRyxDQUFDLEVBQ3BCLGNBQWMsRUFDZCxjQUFjLEVBQ2YsRUFBRSxFQUFFO0lBRUgsTUFBTSxhQUFhLEdBQUcsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUNwQyxPQUFPLFdBQVcsS0FBSyxRQUFRLElBQUksV0FBVyxLQUFLLElBQUksQ0FBQztJQUUxRCxJQUFJLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBQztRQUNsRSxNQUFNLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUV4QyxNQUFNLGNBQWMsR0FBRyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FDOUIsT0FBTyxHQUFHLEtBQUssUUFBUTtRQUNyQixPQUFPLEdBQUcsS0FBSyxRQUFRO1FBQ3ZCLE9BQU8sR0FBRyxLQUFLLFFBQVEsSUFBSSxHQUFHLFlBQVksTUFBTSxDQUFDLENBQUM7SUFFdEQsTUFBTSxjQUFjLEdBQUcsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUMvQixPQUFPLEtBQUssS0FBSyxVQUFVLENBQUM7SUFFOUIsb0NBQW9DO0lBQ3BDLE1BQU0sZUFBZSxHQUFHLEVBQUUsQ0FBQztJQUMzQixNQUFNLGlCQUFpQixHQUFHLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxFQUFFO1FBQzdDLElBQUksUUFBUSxHQUFHLGVBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN4QyxJQUFJLENBQUMsUUFBUTtZQUNYLFFBQVEs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