import { JSONSchema4 } from 'json-schema';
import { DatasetGrammar, DimensionMapping } from 'src/types/dataset';
import { DimensionGrammar } from 'src/types/dimension';
import { EventGrammar, InstrumentType } from '../../types/event';
// import { InstrumentType, EventGrammar } from 'src/types/event';
import { Column, ColumnType } from './csv-adapter.service';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs').promises;

export const createDimensionGrammarFromCSVDefinition = async (
  csvFilePath: string,
): Promise<DimensionGrammar> => {
  // read csvPath and get first row using file-reader
  const fileContent = await fs.readFile(csvFilePath, 'utf-8');
  const row1 = fileContent.split('\n')[0];
  const row2 = fileContent.split('\n')[1];
  const row3 = fileContent.split('\n')[2];

  // Naming convention for eventis => `<event name>-event.csv`
  // Naming comvention for dimension is => `<dimension name>-dimenstion.csv`
  const dimensionName = csvFilePath
    .split('/')
    .pop()
    .split('.')[0]
    .split('-')[0];

  // Find text "PK" in the first row
  const pk: string = row3.split(',')[row1.split(',').indexOf('PK')];

  // get
  const indexes: string[] = row1
    .split(',')
    .map((value, index) => {
      if (value === 'Index') return index;
      else return -1;
    })
    .filter((value) => value !== -1)
    .map((value) => row3.split(',')[value]);

  // row 2 and 3
  const dimenstionColumns: Column[] = row2.split(',').map((value, index) => {
    return {
      name: row3.split(',')[index],
      type: value,
    };
  });

  const dimensionGrammar = createCompositeDimensionGrammars(
    dimenstionColumns,
    dimensionName,
    pk,
    indexes,
  );
  return dimensionGrammar;
};

export const createCompositeDimensionGrammars = (
  dimensionColumns: Column[],
  name: string,
  primaryId: string,
  indexes: string[],
): DimensionGrammar => {
  // Create propteries from dimenstion columns
  const properties = {};
  for (let i = 0; i < dimensionColumns.length; i++) {
    properties[dimensionColumns[i].name] = {
      type: dimensionColumns[i].type,
      unique: true,
    };
  }

  return {
    name: name,
    description: '',
    type: 'dynamic',
    storage: {
      indexes: ['name'],
      primaryId: primaryId,
      retention: null,
      bucket_size: null,
    },
    schema: {
      title: name,
      psql_schema: 'dimensions',
      properties,
      indexes: [{ columns: [indexes.map((i) => i)] }],
    },
  } as DimensionGrammar;
};

export type EventDimensionMapping = {
  dimensionGrammar: DimensionGrammar;
  dimensionGrammarKey: string;
  eventGrammarKey: string;
};

export const createEventGrammar = (
  eventName: string,
  mapping: EventDimensionMapping,
  columns: Column[],
  instrumentField: string,
): EventGrammar => {
  const properties = {};
  for (let i = 0; i < columns.length; i++) {
    properties[columns[i].name] = {
      type: columns[i].type,
      unique: true,
    };
  }
  const eventGrammar: EventGrammar = {
    name: eventName,
    instrument: {
      type: InstrumentType.COUNTER,
      name: 'counter',
    },
    description: '',
    instrument_field: instrumentField,
    dimension: {
      key: mapping.eventGrammarKey,
      dimension: {
        name: mapping.dimensionGrammar,
        mapped_to: mapping.dimensionGrammarKey,
      },
    } as DimensionMapping,
    is_active: true,
    schema: {
      properties,
    } as JSONSchema4,
  } as EventGrammar;

  return eventGrammar;
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

export const createEventGrammarFromCSVDefinition = async (
  csvFilePath: string,
  dimensionFileBasePath: string,
): Promise<EventGrammar[]> => {
  const eventGrammars: EventGrammar[] = [];

  const fileContent = await fs.readFile(csvFilePath, 'utf-8');
  const row1 = fileContent.split('\n')[0];
  const row2 = fileContent.split('\n')[1];
  const row3 = fileContent.split('\n')[2];
  const row4 = fileContent.split('\n')[3];
  const row5 = fileContent.split('\n')[4];

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

  // Find eventGrammarsDefs where field type is dimension
  const dimensionGrammarDefs = eventGrammarDef.filter(
    (value) => value.fieldType === FieldType.dimension,
  );

  // Find text "metric" in trow 5 get it's index and get the value from row 4
  const instrumentField = row4.split(',')[row5.split(',').indexOf('metric')];

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
      csvFilePath.split('/').pop().split('.')[0].split('-')[0] +
      '_' +
      dimensionGrammarDefs[i].dimensionName;

    const eventGrammar = createEventGrammar(
      eventName,
      mapping,
      eventColumns,
      instrumentField,
    );

    // console.log(JSON.stringify(eventGrammar, null, 2));

    eventGrammars.push(eventGrammar);
  }

  return eventGrammars;
};

export const createDatasetGrammarsFromEG = (
  folderName: string,
  dimensionGrammars: DimensionGrammar[],
  defaultTimeDimensions: string[],
  eventGrammars: EventGrammar[],
): DatasetGrammar[] => {
  const datasetGrammars: DatasetGrammar[] = [];
  for (let j = 0; j < defaultTimeDimensions.length; j++) {
    for (let k = 0; k < eventGrammars.length; k++) {
      const dimensionMapping: DimensionMapping[] = [];
      dimensionMapping.push(eventGrammars[k].dimension);
      const propetyName = `${eventGrammars[k].dimension.dimension.name.name}_id`;
      const name = `${folderName}_${eventGrammars[k].name.split('_')[0]}_${
        defaultTimeDimensions[j]
      }_${eventGrammars[k].dimension.dimension.name.name}`;
      const dataserGrammar: DatasetGrammar = {
        // content_subject_daily_total_interactions
        name,
        description: '',
        dimensions: dimensionMapping,
        schema: {
          title: name,
          psql_schema: 'datasets',
          properties: {
            [propetyName]: {
              type: 'string',
            },
          },
        },
      };
      datasetGrammars.push(dataserGrammar);
    }
  }
  return datasetGrammars;
};
