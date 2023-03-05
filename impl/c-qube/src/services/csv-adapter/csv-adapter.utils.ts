import { JSONSchema4 } from 'json-schema';
import {
  DatasetGrammar,
  DimensionMapping,
  TimeDimension,
} from 'src/types/dataset';
import { DimensionGrammar } from 'src/types/dimension';
import {
  EventGrammar,
  InstrumentType,
  Event as cQubeEvent,
} from '../../types/event';
// import { InstrumentType, EventGrammar } from 'src/types/event';
import { Column, ColumnType } from './csv-adapter.service';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs').promises;

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pl = require('nodejs-polars');

export const createDimensionGrammarFromCSVDefinition = async (
  csvFilePath: string,
): Promise<DimensionGrammar> => {
  // read csvPath and get first row using file-reader
  const fileContent = await fs.readFile(csvFilePath, 'utf-8');
  const row1 = fileContent.split('\n')[0].trim();
  const row2 = fileContent.split('\n')[1].trim();
  const row3 = fileContent.split('\n')[2].trim();

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
  const dimensionColumns: Column[] = row2.split(',').map((value, index) => {
    return {
      name: row3.split(',')[index],
      type: value,
    };
  });

  const dimensionGrammar = createCompositeDimensionGrammars(
    dimensionColumns,
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
      unique:
        indexes.indexOf(dimensionColumns[i].name) > -1 ||
        dimensionColumns[i].name === primaryId,
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
      const datasetGrammar: DatasetGrammar = createSingleDatasetGrammarsFromEG(
        folderName,
        defaultTimeDimensions[j],
        eventGrammars[k],
      );
      datasetGrammars.push(datasetGrammar);
    }
  }
  return datasetGrammars;
};

export const createSingleDatasetGrammarsFromEG = (
  folderName: string,
  defaultTimeDimension: string,
  eventGrammars: EventGrammar,
): DatasetGrammar => {
  const dimensionMapping: DimensionMapping[] = [];
  dimensionMapping.push(eventGrammars.dimension[0]);
  const propetyName = `${eventGrammars.dimension[0]?.dimension.name.name}_id`;
  const name = `${folderName}_${
    eventGrammars.name.split('_')[0]
  }_${defaultTimeDimension}_${eventGrammars.dimension[0]?.dimension.name.name}`;
  const timeDimensionKeySet = {
    Weekly: 'week',
    Monthly: 'month',
    Yearly: 'year',
    Daily: 'date',
  };
  const dataserGrammar: DatasetGrammar = {
    // content_subject_daily_total_interactions
    name,
    description: '',
    dimensions: dimensionMapping,
    timeDimension: {
      key: timeDimensionKeySet[defaultTimeDimension],
      type: defaultTimeDimension,
    } as TimeDimension,
    schema: {
      title: name,
      psql_schema: 'datasets',
      properties: {
        [propetyName]: {
          type: 'string',
        },
        sum: {
          type: 'number',
        },
        count: {
          type: 'number',
        },
      },
    },
  };
  return dataserGrammar;
};

// Parse date in the following format: 02/01/23
export const getDate = (date): Date => {
  const splitDate = date.split('/');
  const day = parseInt(splitDate[0], 10);
  const month = parseInt(splitDate[1], 10);
  const year = 2000 + parseInt(splitDate[2], 10);
  const dateObject = new Date(year, month - 1, day);
  return dateObject;
};

// Parse date in the following format: 02/01/23
export const getWeek = (date): number => {
  const splitDate = date.split('/');
  const day = parseInt(splitDate[0], 10);
  const month = parseInt(splitDate[1], 10);
  const year = 2000 + parseInt(splitDate[2], 10);
  const dateObject = new Date(year, month - 1, day);
  return Math.ceil(
    (dateObject.getTime() -
      new Date(dateObject.getFullYear(), 0, 1).getTime()) /
      (1000 * 60 * 60 * 24 * 7),
  );
};

// Parse date in the following format: 02/01/23
export const getMonth = (date): number => {
  const splitDate = date.split('/');
  const day = parseInt(splitDate[0], 10);
  const month = parseInt(splitDate[1], 10);
  return month;
};

// Parse date in the following format: 02/01/23
export const getYear = (date): number => {
  const splitDate = date.split('/');
  const day = parseInt(splitDate[0], 10);
  const month = parseInt(splitDate[1], 10);
  const year = 2000 + parseInt(splitDate[2], 10);
  const dateObject = new Date(year, month - 1, day);
  return dateObject.getFullYear();
};

export const createDatasetDataToBeInsertedFromEG = async (
  folderName: string,
  timeDimension: string,
  eventGrammar: EventGrammar,
): Promise<cQubeEvent[]> => {
  const dimensionMapping: DimensionMapping[] = [];
  dimensionMapping.push(eventGrammar.dimension[0]);
  const propetyName = `${eventGrammar.dimension[0].dimension.name.name}_id`;

  const filePath =
    folderName + '/' + eventGrammar.name.split('_')[0] + '-event.data.csv';
  // const df: DataFrame = pl.readCSV(filePath);
  // let dfModified: DataFrame;

  const fileContent = await fs.readFile(filePath, 'utf-8');
  const lines = fileContent.split('\n');
  const df = [];
  for (let i = 0; i < lines.length; i++) {
    df.push(lines[i].split(',').map((value) => value.trim()));
  }

  const getIndexForHeader = (headers: string[], header: string): number => {
    return headers.indexOf(header);
  };

  // Get headers
  const headers = df[0];

  // Get index for non time dimension
  const dimenstionIndex = getIndexForHeader(headers, propetyName);

  // Get index for timeDimension
  const timeDimensionIndex = getIndexForHeader(headers, 'date');

  // Counter index
  const counterIndex = getIndexForHeader(
    headers,
    eventGrammar.instrument_field,
  );

  const datasetEvents: cQubeEvent[] = [];
  for (let row = 1; row < df.length - 1; row++) {
    const rowData = df[row];
    const rowObject = {};
    rowObject[eventGrammar.instrument_field] = parseInt(rowData[counterIndex]);
    rowObject[propetyName] = rowData[dimenstionIndex];
    // rowObject[eventGrammars.dimension.dimension.name.name] =
    // rowData[dimenstionIndex];
    if (timeDimension === 'Daily') {
      rowObject['date'] = getDate(rowData[timeDimensionIndex]);
    } else if (timeDimension === 'Weekly') {
      rowObject['week'] = getWeek(rowData[timeDimensionIndex]);
      rowObject['year'] = getYear(rowData[timeDimensionIndex]);
    } else if (timeDimension === 'Monthly') {
      rowObject['month'] = getMonth(rowData[timeDimensionIndex]);
      rowObject['year'] = getYear(rowData[timeDimensionIndex]);
    } else if (timeDimension === 'Yearly') {
      rowObject['year'] = getYear(rowData[timeDimensionIndex]);
    }
    datasetEvents.push({ data: rowObject, spec: eventGrammar });
  }
  return datasetEvents;

  // remove all columns except propertyName, timeDimension, and dimension.
  // Add a timeDimension column based on the date of the event.
  // new column name is date, week, month or year depending on the selected timeDimension
};

export const createCompoundDatasetDataToBeInserted = async (
  eventFilePath: string,
  eventGrammar: EventGrammar,
  datasetGrammar: DatasetGrammar,
): Promise<cQubeEvent[]> => {
  const dimensionMapping: DimensionMapping[] = [];
  dimensionMapping.push(eventGrammar.dimension[0]);
  const properties = datasetGrammar.schema.properties;
  delete properties.date;
  delete properties.avg;
  delete properties.sum;
  delete properties.count;
  delete properties.year;

  const fileContent = await fs.readFile(eventFilePath, 'utf-8');
  const lines = fileContent.split('\n');
  const df = [];
  for (let i = 0; i < lines.length; i++) {
    df.push(lines[i].split(',').map((value) => value.trim()));
  }

  const getIndexForHeader = (headers: string[], header: string): number => {
    return headers.indexOf(header);
  };

  // Get headers
  const headers = df[0];

  // Get index for timeDimension
  const timeDimensionIndex = getIndexForHeader(headers, 'date');

  // Counter index
  const counterIndex = getIndexForHeader(
    headers,
    eventGrammar.instrument_field,
  );

  const datasetEvents: cQubeEvent[] = [];

  for (let row = 1; row < df.length - 1; row++) {
    const rowData = df[row];
    const rowObject = {};
    rowObject[eventGrammar.instrument_field] = parseInt(rowData[counterIndex]);
    for (const property in properties) {
      // TODO: Fix this hack
      const dimensionIndex = getIndexForHeader(headers, property);
      rowObject[property] = rowData[dimensionIndex];
    }
    if (datasetGrammar.timeDimension.type === 'Daily') {
      rowObject['date'] = getDate(rowData[timeDimensionIndex]);
    } else if (datasetGrammar.timeDimension.type === 'Weekly') {
      rowObject['week'] = getWeek(rowData[timeDimensionIndex]);
      rowObject['year'] = getYear(rowData[timeDimensionIndex]);
    } else if (datasetGrammar.timeDimension.type === 'Monthly') {
      rowObject['month'] = getMonth(rowData[timeDimensionIndex]);
      rowObject['year'] = getYear(rowData[timeDimensionIndex]);
    } else if (datasetGrammar.timeDimension.type === 'Yearly') {
      rowObject['year'] = getYear(rowData[timeDimensionIndex]);
    }
    datasetEvents.push({ data: rowObject, spec: eventGrammar });
  }
  return datasetEvents;

  // remove all columns except propertyName, timeDimension, and dimension.
  // Add a timeDimension column based on the date of the event.
  // new column name is date, week, month or year depending on the selected timeDimension
};

export const createCompoundDatasetGrammars = async (
  namespace: string,
  defaultTimeDimension: string,
  compoundDimension: string[],
  allDimensionGrammars: DimensionGrammar[],
  eventGrammarFiles: string[],
): Promise<DatasetGrammar[]> => {
  const datasetGrammars: DatasetGrammar[] = [];
  for (const eventGrammarFile of eventGrammarFiles) {
    const {
      eventGrammarDef,
    }: {
      eventGrammarDef: EventGrammarCSVFormat[];
      instrumentField: string;
    } = await getEGDefFromFile(eventGrammarFile);
    const dimensionMapping: DimensionMapping[] = [];
    const properties: Record<string, Record<string, string>> = {};
    const name = `${namespace}_${
      eventGrammarFile.split('/').pop().split('.')[0].split('-')[0]
    }_${defaultTimeDimension}_${compoundDimension.join('0')}`;
    for (const dimension of compoundDimension) {
      for (const egd of eventGrammarDef) {
        if (egd.dimensionName === dimension) {
          const dg: DimensionGrammar = allDimensionGrammars.filter(
            (v) => v.name === dimension,
          )[0];
          const dimensionMappingObject: DimensionMapping = {
            key: egd.dimensionGrammarKey,
            dimension: {
              name: dg,
              mapped_to: egd.dimensionGrammarKey,
            },
          };
          dimensionMapping.push(dimensionMappingObject);
          console.error({ dimensionMapping });
          properties[`${dimension}_id`] = {
            type: 'string',
          };
          // TODO: Fix this hack.
          break;
        }
      }
    }
    if (name === 'school_attendance_totalstudent_Daily_gender0school') {
      console.error({
        eventGrammarDef,
        compoundDimension,
        eventGrammarFile,
        eventGrammarFiles,
        dimensionMapping,
      });
    }
    const timeDimensionKeySet = {
      Weekly: 'week',
      Monthly: 'month',
      Yearly: 'year',
      Daily: 'date',
    };
    const dataserGrammar: DatasetGrammar = {
      // content_subject_daily_total_interactions
      name,
      description: '',
      dimensions: dimensionMapping,
      timeDimension: {
        key: timeDimensionKeySet[defaultTimeDimension],
        type: defaultTimeDimension,
      } as TimeDimension,
      schema: {
        title: name,
        psql_schema: 'datasets',
        properties: {
          ...properties,
        },
      },
    };
    datasetGrammars.push(dataserGrammar);
  }
  return datasetGrammars;
};

function getDGDefsFromEGDefs(eventGrammarDef: EventGrammarCSVFormat[]) {
  return eventGrammarDef.filter(
    (value) => value.fieldType === FieldType.dimension,
  );
}

export async function getEGDefFromFile(csvFilePath: string) {
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
