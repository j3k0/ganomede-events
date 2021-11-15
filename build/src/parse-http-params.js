'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseLatestGetParams = exports.parsePostParams = exports.parseGetParams = void 0;
const hasOwnProperty = (obj, prop) => Object.hasOwnProperty.call(obj, prop);
const toInt = (something, defaultValue = NaN) => {
    const str = String(something);
    const int = parseInt(str, 10);
    const ok = isFinite(int) && (String(int)) === str;
    return ok ? int : defaultValue;
};
const toIntWithinRange = ({ min = 0, max = Number.MAX_SAFE_INTEGER, byDefault = NaN } = {}) => (paramValue) => {
    const desired = toInt(paramValue, byDefault);
    if (desired < min)
        return byDefault;
    if (desired > max)
        return byDefault;
    return desired;
};
const nonEmptyString = (paramValue, defaultValue = undefined) => {
    const ok = (typeof paramValue === 'string') && (paramValue.length > 0);
    return ok ? paramValue : defaultValue;
};
const parseAfter = toIntWithinRange({ min: 0, byDefault: 0 });
const parseLimit = toIntWithinRange({ min: 1, max: 100, byDefault: 100 });
const parseGetParams = (params = { clientId: '', channel: '', after: '', limit: '' }) => {
    const clientId = nonEmptyString(params.clientId);
    if (!clientId)
        return new Error('Invalid Client ID');
    const channel = nonEmptyString(params.channel);
    if (!channel)
        return new Error('Invalid Channel');
    const after = parseAfter(params.after);
    const limit = parseLimit(params.limit);
    return {
        clientId,
        channel,
        after,
        limit,
        afterExplicitlySet: hasOwnProperty(params, 'after')
    };
};
exports.parseGetParams = parseGetParams;
const parsePostParams = (params = { clientId: '', channel: '', from: '', type: '', data: '' }) => {
    const clientId = nonEmptyString(params.clientId);
    if (!clientId)
        return new Error('Invalid Client ID');
    const channel = nonEmptyString(params.channel);
    if (!channel)
        return new Error('Invalid Channel');
    const from = nonEmptyString(params.from);
    if (!from)
        return new Error('Invalid from');
    const type = nonEmptyString(params.type);
    if (!type)
        return new Error('Invalid type');
    const hasData = hasOwnProperty(params, 'data');
    const data = params.data;
    if (hasData) {
        const dataOk = data && (typeof data === 'object');
        if (!dataOk)
            return new Error('Invalid data');
    }
    const event = hasData
        ? { type, from, data }
        : { type, from };
    return { clientId, channel, event };
};
exports.parsePostParams = parsePostParams;
const parseLatestGetParams = (params = { channel: '', limit: 0 }) => {
    const channel = nonEmptyString(params.channel);
    if (!channel)
        return new Error('Invalid Channel');
    const limit = parseLimit(params.limit);
    return {
        channel,
        limit
    };
};
exports.parseLatestGetParams = parseLatestGetParams;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyc2UtaHR0cC1wYXJhbXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvcGFyc2UtaHR0cC1wYXJhbXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7QUFFYixNQUFNLGNBQWMsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUU1RSxNQUFNLEtBQUssR0FBRyxDQUFDLFNBQVMsRUFBRSxZQUFZLEdBQUcsR0FBRyxFQUFFLEVBQUU7SUFDOUMsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQzlCLE1BQU0sR0FBRyxHQUFHLFFBQVEsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDOUIsTUFBTSxFQUFFLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDO0lBQ2xELE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQztBQUNqQyxDQUFDLENBQUM7QUFFRixNQUFNLGdCQUFnQixHQUFHLENBQUMsRUFDeEIsR0FBRyxHQUFHLENBQUMsRUFDUCxHQUFHLEdBQUcsTUFBTSxDQUFDLGdCQUFnQixFQUM3QixTQUFTLEdBQUcsR0FBRyxFQUNoQixHQUFHLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxVQUFVLEVBQUUsRUFBRTtJQUN4QixNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsVUFBVSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQzdDLElBQUksT0FBTyxHQUFHLEdBQUc7UUFBRSxPQUFPLFNBQVMsQ0FBQztJQUNwQyxJQUFJLE9BQU8sR0FBRyxHQUFHO1FBQUUsT0FBTyxTQUFTLENBQUM7SUFDcEMsT0FBTyxPQUFP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