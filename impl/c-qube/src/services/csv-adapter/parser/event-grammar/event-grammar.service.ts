import { EventGrammar, InstrumentType } from '../../../../types/event';
import { getDGDefsFromEGDefs } from '../../csv-adapter.utils';
import {
  createDimensionGrammarFromCSVDefinition,
  getInstrumentField,
  mapPropertiesFromColumns,
  processCSVtoEventGrammarDefJSON,
} from './event-grammar.helpers';
import { DimensionMapping } from '../../../../types/dataset';
import { JSONSchema4 } from 'json-schema';
import {
  Column,
  EventDimensionMapping,
  EventGrammarCSVFormat,
  FieldType,
} from '../../types/parser';
import { readCSVFile } from '../utils/csvreader';

export async function getEGDefFromFile(csvFilePath: string) {
  const [
    dimensionName,
    dimensionGrammarKey,
    fieldDataType,
    fieldName,
    fieldType,
  ] = await readCSVFile(csvFilePath);

  const eventGrammarDef: EventGrammarCSVFormat[] =
    processCSVtoEventGrammarDefJSON(
      dimensionName,
      dimensionGrammarKey,
      fieldDataType,
      fieldName,
      fieldType,
    );
  // Find text "metric" in row 5 get it's index and get the value from row 4
  const instrumentField = getInstrumentField(fieldName, fieldType);

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

  for (const dimensionGrammarDef of dimensionGrammarDefs) {
    const dimensionGrammar = await createDimensionGrammarFromCSVDefinition(
      `${dimensionFileBasePath}/${dimensionGrammarDef.dimensionName}-dimension.grammar.csv`,
    );
    const mapping: EventDimensionMapping = {
      dimensionGrammar: dimensionGrammar,
      dimensionGrammarKey: dimensionGrammarDef.dimensionGrammarKey,
      eventGrammarKey: dimensionGrammarDef.fieldName,
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
      name: dimensionGrammarDef.fieldName,
      type: dimensionGrammarDef.fieldDataType,
    });

    // Naming convention for event is => `<event name>-event.csv`
    // Naming comvention for dimension is => `<dimension name>-dimenstion.csv`
    const eventName =
      programNamespace +
      '_' +
      csvFilePath.split('/').pop().split('.')[0].split('-')[0] +
      '_' +
      dimensionGrammarDef.dimensionName +
      '_' +
      mapping.dimensionGrammarKey;

    const eventGrammar = createEventGrammar(
      eventName,
      mapping,
      eventColumns,
      instrumentField,
      csvFilePath,
    );

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
  const properties = mapPropertiesFromColumns(columns);

  // creating the event grammar object
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
