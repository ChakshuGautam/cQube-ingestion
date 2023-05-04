import { DimensionGrammar } from 'src/types/dimension';

import { ColumnType } from './csv-adapter.service';

import { getEGDefFromFile } from './csv-parser/eventgrammar/parser';

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

export function getDGDefsFromEGDefs(eventGrammarDef: EventGrammarCSVFormat[]) {
  return eventGrammarDef.filter(
    (value) => value.fieldType === FieldType.dimension,
  );
}

export async function isTimeDimensionPresent(csvFilePath: string) {
  const {
    eventGrammarDef,
  }: {
    eventGrammarDef: EventGrammarCSVFormat[];
    instrumentField: string;
  } = await getEGDefFromFile(csvFilePath);

  //TODO Fix this - assumes the first column to be date.
  for (let i = 0; i < eventGrammarDef.length; i++) {
    if (eventGrammarDef[i].fieldType === 'timeDimension') {
      return true;
    } else {
      return false;
    }
  }
}
