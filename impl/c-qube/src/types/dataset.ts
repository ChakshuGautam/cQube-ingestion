import { JSONSchema4 } from 'json-schema';
import { DimensionGrammar } from './dimension';

export interface DimensionMapping {
  key: string;
  dimension: {
    name: DimensionGrammar;
    mapped_to: string;
  };
}

export interface DatasetGrammar {
  name: string;
  description: string;
  dimensions: DimensionMapping[];
  schema: JSONSchema4;
}

export interface Dataset {
  data: object;
  spec: DatasetGrammar;
}
