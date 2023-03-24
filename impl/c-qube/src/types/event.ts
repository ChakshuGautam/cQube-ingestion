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
  file?: string;
  name: string;
  instrument: Instrument;
  description: string;
  schema: JSONSchema4;
  instrument_field: string;
  is_active: boolean;
  type?: 'single-dimension' | 'multi-dimension';
  dimension: DimensionMapping[] | DimensionMapping;
  program?: string;
}

export interface Event {
  data: object;
  spec: EventGrammar;
}
