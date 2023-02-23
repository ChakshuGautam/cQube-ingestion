import { JSONSchema4 } from 'json-schema';
import { DatasetGrammar, DimensionMapping } from 'src/types/dataset';
import { DimensionGrammar } from 'src/types/dimension';
import { EventGrammar, InstrumentType } from '../../types/event';
// import { InstrumentType, EventGrammar } from 'src/types/event';
import { Column } from './csv-adapter.service';
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

export const createEventGrammarFromCSVDefinition = async (
  csvFilePath: string,
  dimensionFileBasePath: string,
): Promise<EventGrammar> => {
  const fileContent = await fs.readFile(csvFilePath, 'utf-8');
  const row1 = fileContent.split('\n')[0];
  const row2 = fileContent.split('\n')[1];
  const row3 = fileContent.split('\n')[2];
  const row4 = fileContent.split('\n')[3];
  const row5 = fileContent.split('\n')[4];

  // Naming convention for eventis => `<event name>-event.csv`
  // Naming comvention for dimension is => `<dimension name>-dimenstion.csv`
  const eventName = csvFilePath.split('/').pop().split('.')[0].split('-')[0];

  // Get name for dimenstion from row 1
  const dimensionName = row1.split(',').filter((value) => value !== '')[0];
  const dimensionGrammarKey = row1
    .split(',')
    .map((value, index) => {
      if (value !== '') return index;
      else return -1;
    })
    .filter((value) => value !== -1)
    .map((value) => row2.split(',')[value])[0];

  const eventGrammarKey = row1
    .split(',')
    .map((value, index) => {
      if (value !== '') return index;
      else return -1;
    })
    .filter((value) => value !== -1)
    .map((value) => row4.split(',')[value])[0];

  // Find text "metric" in trow 5 get it's index and get the value from row 4
  const instrumentField = row4.split(',')[row5.split(',').indexOf('metric')];

  const dimensionGrammarForCluster: DimensionGrammar =
    await createDimensionGrammarFromCSVDefinition(
      `${dimensionFileBasePath}/${dimensionName}-dimension.grammar.csv`,
    );

  // row 1 and row 2
  const mapping: EventDimensionMapping = {
    dimensionGrammar: dimensionGrammarForCluster,
    dimensionGrammarKey: dimensionGrammarKey,
    eventGrammarKey: eventGrammarKey,
  };

  // row 3 and 4
  const eventColumns: Column[] = row3.split(',').map((value, index) => {
    return {
      name: row4.split(',')[index],
      type: value,
    };
  });

  const eventGrammar = createEventGrammar(
    eventName,
    mapping,
    eventColumns,
    instrumentField,
  );
  return eventGrammar;
};

export const generateDatasetGrammarsFromEGandDimG = (
  dimensionGrammars: DimensionGrammar[],
  defaultTimeDimensions: string[],
  eventGrammars: EventGrammar[],
): DatasetGrammar[] => {
  const datasetGrammars: DatasetGrammar[] = [];
  for (let i = 0; i < dimensionGrammars.length; i++) {
    for (let j = 0; j < defaultTimeDimensions.length; j++) {
      for (let k = 0; k < eventGrammars.length; k++) {
        const dimensionMapping: DimensionMapping[] = [];
        dimensionMapping.push(eventGrammars[k].dimension);
        const dataserGrammar: DatasetGrammar = {
          // content_subject_daily_total_interactions
          name: `${dimensionGrammars[i].name}_${defaultTimeDimensions[j]}_${eventGrammars[k].name}`,
          description: '',
          dimensions: dimensionMapping,
          schema: {
            title: `${dimensionGrammars[i].name}_${defaultTimeDimensions[j]}_${eventGrammars[k].name}`,
            psql_schema: 'datasets',
            properties: {
              [dimensionGrammars[i].name]: { type: 'string' },
            },
          },
        };

        datasetGrammars.push(dataserGrammar);
      }
    }
  }
  return datasetGrammars;
};
