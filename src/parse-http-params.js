'use strict';

const toInt = (something, defaultValue = NaN) => {
  const str = String(something);
  const int = parseInt(str, 10);
  const ok = isFinite(int) && (String(int)) === str;
  return ok ? int : defaultValue;
};

const toIntWithinRange = ({
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  byDefault = NaN
} = {}) => (paramValue) => {
  const desired = toInt(paramValue, byDefault);
  if (desired < min) return byDefault;
  if (desired > max) return byDefault;
  return desired;
};

const nonEmptyString = (paramValue, defaultValue = undefined) => {
  const ok = (typeof paramValue === 'string') && (paramValue.length > 0);
  return ok ? paramValue : defaultValue;
};

const parseAfter = toIntWithinRange({min: 0, byDefault: 0});
const parseLimit = toIntWithinRange({min: 1, max: 100, byDefault: 100});

const parseGetParams = (params = {}) => {
  const clientId = nonEmptyString(params.clientId);
  if (!clientId)
    return new Error('Invalid Client ID');

  const channel = nonEmptyString(params.channel);
  if (!channel)
    return new Error('Invalid Channel');

  const after = parseAfter(params.after);
  const limit = parseLimit(params.limit);

  return {clientId, channel, after, limit};
};

const parsePostParams = (params = {}) => {
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

  const hasData = params.hasOwnProperty('data');
  const data = params.data;

  if (hasData) {
    const dataOk = data && (typeof data === 'object');
    if (!dataOk)
      return new Error('Invalid data');
  }

  const event = hasData
    ? {type, from, data}
    : {type, from};

  return {clientId, channel, event};
};

module.exports = {
  parseGetParams,
  parsePostParams
};
