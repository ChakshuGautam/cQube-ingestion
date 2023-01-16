import { JSONSchema7 } from 'json-schema';

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
  schema: JSONSchema7;
  instrument_field: string;
  is_active: boolean;
}

export interface Event {
  data: object;
  spec: EventGrammar;
}
