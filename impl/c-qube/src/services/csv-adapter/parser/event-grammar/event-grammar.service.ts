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

export async function getEGDefFromFile(
  csvFilePath: string,
  singleDimensionWhitelist?: string[],
) {
  const [
    dimensionName,
    dimensionGrammarKey,
    fieldDataType,
    fieldName,
    fieldType,
  ] = await readCSVFile(csvFilePath);
  console.log('csvFilePath: ', csvFilePath);
  // console.log('dimensionName in getEGDefFromFile', dimensionName);

  const eventGrammarDef: EventGrammarCSVFormat[] =
    processCSVtoEventGrammarDefJSON(
      dimensionName,
      dimensionGrammarKey,
      fieldDataType,
      fieldName,
      fieldType,
      singleDimensionWhitelist,
    );
  // Find text "metric" in row 5 get it's index and get the value from row 4
  const instrumentField = getInstrumentField(fieldName, fieldType);
  console.log('eventGrammarDef', eventGrammarDef);
  return { eventGrammarDef, instrumentField };
}

export const createEventGrammarFromCSVDefinition = async (
  csvFilePath: string,
  dimensionFileBasePath: string,
  programNamespace: string,
  whitelistedDimensions?: string[],
): Promise<EventGrammar[]> => {
  if (whitelistedDimensions.length === 0) return []; // this is the case when onlyCreateWhitelist is true and the user has not specified any single dimensions as whitelisted

  const eventGrammars: EventGrammar[] = [];
  let egDefFromFile: {
    eventGrammarDef: EventGrammarCSVFormat[];
    instrumentField: string;
  };

  if (whitelistedDimensions.length === 1 && whitelistedDimensions[0] === '*') {
    // case when onlyCreateWhiteListed is false or is true and the user has defined '*' to signify all dimensions
    egDefFromFile = await getEGDefFromFile(csvFilePath, null);
  } else {
    // case when onlyCreateWhiteListed is True and we pass in the array of whitelisted dimensions
    egDefFromFile = await getEGDefFromFile(csvFilePath, whitelistedDimensions);
  }

  // Find eventGrammarsDefs where field type is dimension
  const dimensionGrammarDefs = getDGDefsFromEGDefs(
    egDefFromFile.eventGrammarDef,
  );

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
    const eventColumns: Column[] = egDefFromFile.eventGrammarDef
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
      egDefFromFile.instrumentField,
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
