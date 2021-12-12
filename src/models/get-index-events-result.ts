import { Event } from '../events.store';

export type GetIndexEventsResult = {
  id: string;
  field: string;
  value: string;
  rows: Event[];
}
