import { JSONSchema4 } from 'json-schema';
import { Dimension } from './dimension';

export interface DimensionMapping {
  key: string;
  dimension: {
    name: Dimension;
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