import { EventGrammar, InstrumentType } from '../../../../types/event';
import { getDGDefsFromEGDefs } from '../../csv-adapter.utils';
import { createDimensionGrammarFromCSVDefinition } from '../dimensiongrammar/parser';
import { DimensionMapping } from '../../../../types/dataset';
import { JSONSchema4 } from 'json-schema';
import {
  Column,
  ColumnType,
  EventDimensionMapping,
  EventGrammarCSVFormat,
  FieldType,
} from '../../types/parser';
const fs = require('fs').promises;

export async function getEGDefFromFile(csvFilePath: string) {
  // TODO: removeEmptyLines; Caused an issue when ingesting data with first line as blank.
  const fileContent = await fs.readFile(csvFilePath, 'utf-8');
  const row1 = fileContent.split('\n')[0].trim();
  const row2 = fileContent.split('\n')[1].trim();
  const row3 = fileContent.split('\n')[2].trim();
  const row4 = fileContent.split('\n')[3].trim();
  const row5 = fileContent.split('\n')[4].trim();

  // Vertical columns for CSV File
  // | dimensionName |
  // | dimensionGrammarKey |
  // | fieldDataType |
  // | fieldName |
  // | fieldType |
  const eventGrammarDef: EventGrammarCSVFormat[] = row5
    .split(',')
    .map((value, index) => {
      return {
        dimensionName:
          row1.split(',')[index] === '' ? null : row1.split(',')[index],
        dimensionGrammarKey:
          row2.split(',')[index] === '' ? null : row2.split(',')[index],
        fieldDataType: row3.split(',')[index] as ColumnType,
        fieldName: row4.split(',')[index],
        fieldType: row5.split(',')[index] as FieldType,
      };
    });
  // Find text "metric" in trow 5 get it's index and get the value from row 4
  const instrumentField = row4.split(',')[row5.split(',').indexOf('metric')];
  return { eventGrammarDef, instrumentField };
}

export const createEventGrammarFromCSVDefinition = async (
  csvFilePath: string,
  dimensionFileBasePath: string,
  programNamespace: string,
): Promise<EventGrammar[]> => {
  const eventGrammars: EventGrammar[] = [];

  const {
    eventGrammarDef,
    instrumentField,
  }: {
    eventGrammarDef: EventGrammarCSVFormat[];
    instrumentField: string;
  } = await getEGDefFromFile(csvFilePath);

  // Find eventGrammarsDefs where field type is dimension
  const dimensionGrammarDefs = getDGDefsFromEGDefs(eventGrammarDef);

  for (let i = 0; i < dimensionGrammarDefs.length; i++) {
    const dimensionGrammar = await createDimensionGrammarFromCSVDefinition(
      `${dimensionFileBasePath}/${dimensionGrammarDefs[i].dimensionName}-dimension.grammar.csv`,
    );
    const mapping: EventDimensionMapping = {
      dimensionGrammar: dimensionGrammar,
      dimensionGrammarKey: dimensionGrammarDefs[i].dimensionGrammarKey,
      eventGrammarKey: dimensionGrammarDefs[i].fieldName,
    };

    // Ignore every other dimension and pick the other ones.
    const eventColumns: Column[] = eventGrammarDef
      .filter((value) => value.fieldType !== FieldType.dimension)
      .map((value) => {
        return {
          name: value.fieldName,
          type: value.fieldDataType,
        };
      });
    eventColumns.push({
      name: dimensionGrammarDefs[i].fieldName,
      type: dimensionGrammarDefs[i].fieldDataType,
    });

    // Naming convention for eventis => `<event name>-event.csv`
    // Naming comvention for dimension is => `<dimension name>-dimenstion.csv`
    const eventName =
      programNamespace +
      '_' +
      csvFilePath.split('/').pop().split('.')[0].split('-')[0] +
      '_' +
      dimensionGrammarDefs[i].dimensionName +
      '_' +
      mapping.dimensionGrammarKey;

    const eventGrammar = createEventGrammar(
      eventName,
      mapping,
      eventColumns,
      instrumentField,
      csvFilePath,
    );

    // console.log(JSON.stringify(eventGrammar, null, 2));

    eventGrammars.push(eventGrammar);
  }

  return eventGrammars;
};

export const createEventGrammar = (
  eventName: string,
  mapping: EventDimensionMapping,
  columns: Column[],
  instrumentField: string,
  csvFilePath: string,
): EventGrammar => {
  const properties = {};
  for (let i = 0; i < columns.length; i++) {
    if (columns[i].type === 'date') {
      properties[columns[i].name] = {
        type: 'string',
        format: 'date',
      };
    } else {
      properties[columns[i].name] = {
        type: columns[i].type,
        unique: true,
      };
    }
  }
  const eventGrammar: EventGrammar = {
    file: csvFilePath,
    name: eventName,
    instrument: {
      type: InstrumentType.COUNTER,
      name: 'counter',
    },
    description: '',
    instrument_field: instrumentField,
    dimension: [
      {
        key: mapping.eventGrammarKey,
        dimension: {
          name: mapping.dimensionGrammar,
          mapped_to: mapping.dimensionGrammarKey,
        },
      },
    ] as DimensionMapping[],
    is_active: true,
    schema: {
      properties,
    } as JSONSchema4,
  } as EventGrammar;

  return eventGrammar;
};
