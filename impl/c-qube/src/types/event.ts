import { JSONSchema4 } from 'json-schema';
import { DimensionMapping } from './dataset';

export enum InstrumentType {
  COUNTER,
}

export interface Instrument {
  type: InstrumentType;
  name: string;
}

export interface EventGrammar {
  name: string;
  instrument: Instrument;
  description: string;
  schema: JSONSchema4;
  instrument_field: string;
  is_active: boolean;
  dimension: DimensionMapping;
}

export interface Event {
  data: object;
  spec: EventGrammar;
}
