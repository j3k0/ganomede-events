import { EventDefinition } from "./events.store";
import { IndexDefinition } from "./models/index-definition";

const hasOwnProperty = (obj: Record<string, unknown>, prop: string) => Object.hasOwnProperty.call(obj, prop);

const toInt = (something: any, defaultValue = NaN) => {
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
const parseLimit = toIntWithinRange({ min: 1, byDefault: 100 });

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
  after?: number | string | Record<string, unknown>;
  limit?: number | string | Record<string, unknown>;
}

export type PostEventsParam = {
  clientId: string;
  channel: string;
  from?: string;
  type?: string;
  data?: Record<string, unknown> | string;
}

export type LatestEventsParam = {
  channel: string;
  limit?: number;
}

export type GetIndicesEventsParam = {
  indexId: string;
  indexValue: string;
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

export const parsePostParams = (params: PostEventsParam = { clientId: '', channel: '', from: '', type: '', data: '' }): Error | { clientId: string, channel: string, event: EventDefinition } => {
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

  const event: EventDefinition = hasData
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


export const parseIndicesPostParams = (params: IndexDefinition = { channel: '', id: '', field: '' }): Error | IndexDefinition => {
  const id = nonEmptyString(params.id);
  if (!id)
    return new Error('Invalid index ID');

  const channel = nonEmptyString(params.channel);
  if (!channel)
    return new Error('Invalid Channel');

  const field = nonEmptyString(params.field);
  if (!field)
    return new Error('Invalid field');


  return { id, channel, field };
};

export const parseIndicesGetParams = (params: GetIndicesEventsParam = { indexId: '', indexValue: '' }): Error | GetIndicesEventsParam => {

  const indexId = nonEmptyString(params.indexId);
  if (!indexId)
    return new Error('Invalid Index id');

  const indexValue = nonEmptyString(params.indexValue);
  if (!indexValue)
    return new Error('Invalid Index Value');


  return {
    indexId,
    indexValue
  };
};
