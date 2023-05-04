import { DimensionGrammar } from '../../../types/dimension';

export type EventDimensionMapping = {
  dimensionGrammar: DimensionGrammar;
  dimensionGrammarKey: string;
  eventGrammarKey: string;
};

export enum FieldType {
  timeDimension = 'timeDimension',
  dimension = 'dimension',
  metric = 'metric',
}

export type EventGrammarCSVFormat = {
  dimensionName: string | null; //row1
  dimensionGrammarKey: string | null; //row2
  fieldDataType: ColumnType; //row3
  fieldName: string; //row4
  fieldType: FieldType; //row5
};

export enum ColumnType {
  string = 'string',
  integer = 'integer',
  float = 'float',
  date = 'date',
}

export type Column = {
  name: string;
  type: ColumnType;
};
