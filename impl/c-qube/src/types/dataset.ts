import { JSONSchema4 } from 'json-schema';
import { DimensionGrammar } from './dimension';

export interface DimensionMapping {
  key: string;
  dimension: {
    name: DimensionGrammar;
    mapped_to: string;
  };
}

export interface TimeDimension {
  key: string;
  type: string;
}

export interface DatasetGrammar {
  name: string;
  description: string;
  dimensions: DimensionMapping[];
  timeDimension?: TimeDimension;
  schema: JSONSchema4;
  isCompound?: boolean;
  program?: string;
}

export interface Dataset {
  data: object;
  spec: DatasetGrammar;
}

export interface DatasetUpdateRequest {
  dataset: DatasetGrammar;
  dimensionFilter: string;
  updateParams: {
    sum: number;
    count: number;
    avg: number;
  };
  filterParams: {
    [key: string]: string;
  };
}
