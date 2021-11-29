const hasOwnProperty = (obj: {}, prop: string) => Object.hasOwnProperty.call(obj, prop);

const toInt = (something: any, defaultValue: number = NaN) => {
  const str = String(something);
  const int = parseInt(str, 10);
  const ok = isFinite(int) && (String(int)) === str;
  return ok ? int : defaultValue;
};

const toIntWithinRange = ({
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  byDefault = NaN
} = {}) => (paramValue: any) => {
  const desired = toInt(paramValue, byDefault);
  if (desired < min) return byDefault;
  if (desired > max) return byDefault;
  return desired;
};

const nonEmptyString = (paramValue: any, defaultValue = undefined) => {
  const ok = (typeof paramValue === 'string') && (paramValue.length > 0);
  return ok ? paramValue : defaultValue;
};

const parseAfter = toIntWithinRange({ min: 0, byDefault: 0 });
const parseLimit = toIntWithinRange({ min: 1, max: 100, byDefault: 100 });

export type ParsedGetEventsParam = {
  clientId: string;
  channel: string;
  after: number;
  limit: number;
  afterExplicitlySet: boolean
}

export type GetEventsParam = {
  clientId: string;
  channel: string;
  after?: number | string | {};
  limit?: number | string | {};
}

export type PostEventsParam = {
  clientId: string;
  channel: string;
  from?: string;
  type?: string;
  data?: {};
}


export type LatestEventsParam = {
  channel: string;
  limit?: number;
}

export const parseGetParams = (params: GetEventsParam = { clientId: '', channel: '' }): Error | ParsedGetEventsParam => {
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
  } as ParsedGetEventsParam;
};

export const parsePostParams = (params: PostEventsParam = { clientId: '', channel: '', from: '', type: '', data: '' }): Error | { clientId: string, channel: string, event: any } => {
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


export const parseLatestGetParams = (params: LatestEventsParam = { channel: '', limit: 0 }): Error | { channel: string, limit: number } => {

  const channel = nonEmptyString(params.channel);
  if (!channel)
    return new Error('Invalid Channel');

  const limit = parseLimit(params.limit);

  return {
    channel,
    limit
  };
};
