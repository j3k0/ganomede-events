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

module.exports = (params = {}) => {
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
