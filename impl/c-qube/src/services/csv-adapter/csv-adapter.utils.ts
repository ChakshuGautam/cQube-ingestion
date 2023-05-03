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
import { Column, ColumnType } from './csv-adapter.service';
const fs = require('fs').promises;

const pl = require('nodejs-polars');
const readline = require('readline');

import * as csv from 'csv-parser';
import { hash, unhash } from '../../utils/hash';
import { DateParser } from './csv-parser/dateparser';
import { promisify } from 'util';
const fs1 = require('fs');

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

export const createDatasetGrammarsFromEG = async (
  folderName: string,
  defaultTimeDimensions: string[],
  eventGrammars: EventGrammar[],
): Promise<DatasetGrammar[]> => {
  const datasetGrammars: DatasetGrammar[] = [];
  for (let j = 0; j < defaultTimeDimensions.length; j++) {
    for (let k = 0; k < eventGrammars.length; k++) {
      // console.log(eventGrammars[k].file);
      const datasetGrammar: DatasetGrammar =
        await createSingleDatasetGrammarsFromEG(
          folderName,
          defaultTimeDimensions[j],
          eventGrammars[k],
          eventGrammars[k].file,
        );
      datasetGrammars.push(datasetGrammar);
    }
  }
  return datasetGrammars;
};

export const createDatasetGrammarsFromEGWithoutTimeDimension = async (
  folderName: string,
  eventGrammars: EventGrammar[],
): Promise<DatasetGrammar[]> => {
  const datasetGrammars: DatasetGrammar[] = [];
  for (let k = 0; k < eventGrammars.length; k++) {
    const datasetGrammar: DatasetGrammar =
      await createSingleDatasetGrammarsFromEGWithoutTimeDimension(
        folderName,
        eventGrammars[k],
      );
    datasetGrammars.push(datasetGrammar);
  }
  return datasetGrammars;
};

export const createSingleDatasetGrammarsFromEGWithoutTimeDimension = async (
  folderName: string,
  eventGrammar: EventGrammar,
): Promise<DatasetGrammar> => {
  const dimensionMapping: DimensionMapping[] = [];
  dimensionMapping.push(eventGrammar.dimension[0]);

  // Get Property Name
  const propertyName = await getPropertyforDatasetGrammarFromEG(eventGrammar);

  const name = `${folderName}_${eventGrammar.instrument_field}_${eventGrammar.dimension[0]?.dimension.name.name}`;
  const datasetGrammar: DatasetGrammar = {
    // content_subject_daily_total_interactions
    name,
    tableName: name,
    tableNameExpanded: name,
    description: '',
    program: folderName,
    eventGrammarFile: eventGrammar.file,
    eventGrammar: eventGrammar,
    isCompound: false,
    dimensions: dimensionMapping,
    schema: {
      title: name,
      psql_schema: 'datasets',
      properties: {
        [propertyName]: {
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
  return datasetGrammar;
};

export const getPropertyforDatasetGrammarFromEG = async (
  eventGrammar: EventGrammar,
): Promise<string> => {
  // Get Property Name
  let propertyName = `${eventGrammar.dimension[0].dimension.name.name}_id`;
  const {
    eventGrammarDef,
  }: {
    eventGrammarDef: EventGrammarCSVFormat[];
    instrumentField: string;
  } = await getEGDefFromFile(eventGrammar.file);
  for (let i = 0; i < eventGrammarDef.length; i++) {
    if (
      eventGrammarDef[i].fieldType === FieldType.dimension &&
      eventGrammarDef[i].dimensionName ===
        eventGrammar.dimension[0].dimension.name.name
    ) {
      propertyName = eventGrammarDef[i].fieldName;
    }
  }
  return propertyName;
};

export const getPropertyforDatasetGrammarFromEGForCompoundDatasets = async (
  eventGrammarDef: EventGrammarCSVFormat[],
  name: string,
): Promise<string> => {
  // Get Property Name
  let propertyName;
  for (let i = 0; i < eventGrammarDef.length; i++) {
    if (
      eventGrammarDef[i].fieldType === FieldType.dimension &&
      eventGrammarDef[i].dimensionGrammarKey === name
    ) {
      propertyName = eventGrammarDef[i].fieldName;
    }
  }
  return propertyName;
};

export const createSingleDatasetGrammarsFromEG = async (
  folderName: string,
  defaultTimeDimension: string,
  eventGrammar: EventGrammar,
  eventGrammarFile?: string,
): Promise<DatasetGrammar> => {
  const dimensionMapping: DimensionMapping[] = [];
  dimensionMapping.push(eventGrammar.dimension[0]);

  // Get Property Name
  const propertyName = await getPropertyforDatasetGrammarFromEG(eventGrammar);

  const name = `${folderName}_${eventGrammar.instrument_field}_${defaultTimeDimension}_${eventGrammar.dimension[0]?.dimension.name.name}`;
  // console.log(name);
  const timeDimensionKeySet = {
    Weekly: 'week',
    Monthly: 'month',
    Yearly: 'year',
    Daily: 'date',
  };
  // console.log('Dataset creation info', eventGrammarFile, name, propertyName);
  const datasetGrammar: DatasetGrammar = {
    // content_subject_daily_total_interactions
    name,
    description: '',
    tableName: name,
    tableNameExpanded: name,
    isCompound: false,
    program: folderName,
    eventGrammarFile: eventGrammar.file || eventGrammarFile,
    eventGrammar: eventGrammar,
    dimensions: dimensionMapping,
    timeDimension: {
      key: timeDimensionKeySet[defaultTimeDimension],
      type: defaultTimeDimension,
    } as TimeDimension,
    schema: {
      title: name,
      psql_schema: 'datasets',
      properties: {
        [propertyName]: {
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
  return datasetGrammar;
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

export const createDatasetDataToBeInserted = async (
  timeDimension: string,
  datasetGrammar: DatasetGrammar,
): Promise<cQubeEvent[]> => {
  const eventGrammar = datasetGrammar.eventGrammar;
  const dimensionMapping: DimensionMapping[] = datasetGrammar.dimensions;
  // const propertyName = await getPropertyforDatasetGrammarFromEG(eventGrammar);
  // Get all keys from datasetGrammar.schema.properties
  const propertyName = Object.keys(datasetGrammar.schema.properties)
    .filter((k) => k !== 'count')
    .filter((k) => k !== 'sum')
    .filter((k) => k !== 'date')[0];

  const filePath = eventGrammar.file.replace('grammar', 'data');
  // const df: DataFrame = pl.readCSV(filePath);
  // let dfModified: DataFrame;

  // const fileContent = await fs.readFile(filePath, 'utf-8');
  // const lines = fileContent.split('\n');
  // const df = [];
  // for (let i = 0; i < lines.length; i++) {
  //   df.push(lines[i].split(',').map((value) => value.trim()));
  // }

  // await processCsv(filePath, filePath.split('.csv')[0] + '_temp.csv');
  const df = await readCSV(filePath);
  const getIndexForHeader = (headers: string[], header: string): number => {
    return headers.indexOf(header);
  };

  // Get headers
  const headers = df[0];

  // Get index for non time dimension
  const dimensionIndex = getIndexForHeader(headers, propertyName);

  // Get index for timeDimension
  const timeDimensionIndex = getIndexForHeader(headers, 'date');

  // Counter index
  const counterIndex = getIndexForHeader(
    headers,
    eventGrammar.instrument_field,
  );

  const dateParser = new DateParser('dd/MM/yy');

  const datasetEvents: cQubeEvent[] = [];
  for (let row = 1; row < df.length - 1; row++) {
    const rowData = df[row];
    try {
      const rowObject = {};
      rowObject[eventGrammar.instrument_field] = parseInt(
        rowData[counterIndex],
      );
      rowObject[propertyName] = rowData[dimensionIndex];
      // rowObject[eventGrammars.dimension.dimension.name.name] =
      // rowData[dimenstionIndex];
      if (timeDimensionIndex > -1) {
        const date = dateParser.parseDate(rowData[timeDimensionIndex]);
        if (timeDimension === 'Daily') {
          rowObject['date'] = date;
          // rowObject['date'] = getDate(rowData[timeDimensionIndex]);
        } else if (timeDimension === 'Weekly') {
          rowObject['week'] = DateParser.getWeek(date);
          rowObject['year'] = DateParser.getYear(date);
          // rowObject['week'] = getWeek(rowData[timeDimensionIndex]);
          // rowObject['year'] = getYear(rowData[timeDimensionIndex]);
        } else if (timeDimension === 'Monthly') {
          rowObject['month'] = DateParser.getMonth(date);
          rowObject['year'] = DateParser.getYear(date);
          // rowObject['month'] = getMonth(rowData[timeDimensionIndex]);
          // rowObject['year'] = getYear(rowData[timeDimensionIndex]);
        } else if (timeDimension === 'Yearly') {
          rowObject['year'] = DateParser.getYear(date);
          // rowObject['year'] = getYear(rowData[timeDimensionIndex]);
        }
      }
      datasetEvents.push({ data: rowObject, spec: eventGrammar });
    } catch (e) {
      console.error('Wrong datapoint', rowData, filePath);
    }
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

  // const fileContent = await fs.readFile(eventFilePath, 'utf-8');
  // const lines = fileContent.split('\n');
  // const df = [];
  // for (let i = 0; i < lines.length; i++) {
  //   df.push(lines[i].split(',').map((value) => value.trim()));
  // }

  // await processCsv(eventFilePath, eventFilePath.split('.csv')[0] + '_temp.csv');
  const df = await readCSV(eventFilePath);

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
  const dateParser = new DateParser('dd/MM/yy');

  for (let row = 1; row < df.length - 1; row++) {
    const rowData = df[row];
    try {
      const rowObject = {};
      rowObject[eventGrammar.instrument_field] = parseInt(
        rowData[counterIndex],
      );
      for (const property in properties) {
        // TODO: Fix this hack
        const dimensionIndex = getIndexForHeader(headers, property);
        rowObject[property] = rowData[dimensionIndex];
      }
      if (datasetGrammar.timeDimension) {
        const date = dateParser.parseDate(rowData[timeDimensionIndex]);
        if (datasetGrammar.timeDimension.type === 'Daily') {
          rowObject['date'] = date;
          // rowObject['date'] = getDate(rowData[timeDimensionIndex]);
        } else if (datasetGrammar.timeDimension.type === 'Weekly') {
          rowObject['week'] = DateParser.getWeek(date);
          rowObject['year'] = DateParser.getYear(date);
          // rowObject['week'] = getWeek(rowData[timeDimensionIndex]);
          // rowObject['year'] = getYear(rowData[timeDimensionIndex]);
        } else if (datasetGrammar.timeDimension.type === 'Monthly') {
          rowObject['month'] = DateParser.getMonth(date);
          rowObject['year'] = DateParser.getYear(date);
          // rowObject['month'] = getMonth(rowData[timeDimensionIndex]);
          // rowObject['year'] = getYear(rowData[timeDimensionIndex]);
        } else if (datasetGrammar.timeDimension.type === 'Yearly') {
          rowObject['year'] = DateParser.getYear(date);
          rowObject['year'] = getYear(rowData[timeDimensionIndex]);
        }
      }
      datasetEvents.push({ data: rowObject, spec: eventGrammar });
    } catch (e) {
      console.error('Wrong datapoint', rowData, eventFilePath);
    }
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
  hashTable,
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
    const prefix = `${namespace}_${
      eventGrammarFile.split('/').pop().split('.')[0].split('-')[0]
    }`;
    const name = `${prefix}_${defaultTimeDimension}_${compoundDimension.join(
      '0',
    )}`;
    // TODO - Create a table called datasetTableName
    // Columns - table_name_expanded, table_name_hash, meta
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
          // console.error({ dimensionMapping });
          const propertyName =
            await getPropertyforDatasetGrammarFromEGForCompoundDatasets(
              eventGrammarDef,
              egd.dimensionGrammarKey,
            );
          properties[propertyName] = {
            type: 'string',
          };
          // console.log('🎉', dg.name, egd.dimensionGrammarKey, propertyName);
          break;
        }
      }
    }
    // console.log(name);
    if (
      name === 'nas_performance_district0lo0subject0grade' ||
      name === 'pm_poshan_category_district0categorypm' ||
      name === 'udise_category_district0categoryudise'
    ) {
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
      tableName: `${prefix}_${hash(name, 'key', hashTable)}`,
      tableNameExpanded: name,
      isCompound: true,
      program: namespace,
      eventGrammarFile,
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

export const createCompoundDatasetGrammarsWithoutTimeDimensions = async (
  namespace: string,
  compoundDimension: string[],
  allDimensionGrammars: DimensionGrammar[],
  eventGrammarFiles: string[],
  hashTable,
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
    const prefix = `${namespace}_${
      eventGrammarFile.split('/').pop().split('.')[0].split('-')[0]
    }`;
    const name = `${prefix}_${compoundDimension.join('0')}`;
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
          // console.error({ dimensionMapping });
          const propertyName =
            await getPropertyforDatasetGrammarFromEGForCompoundDatasets(
              eventGrammarDef,
              egd.dimensionGrammarKey,
            );
          properties[propertyName] = {
            type: 'string',
          };
        }
      }
    }
    const datasetGrammar: DatasetGrammar = {
      // content_subject_daily_total_interactions
      name,
      tableName: `${prefix}_${hash(name, 'key', hashTable)}`,
      tableNameExpanded: name,
      isCompound: true,
      program: namespace,
      eventGrammarFile: eventGrammarFile,
      description: '',
      dimensions: dimensionMapping,
      schema: {
        title: name,
        psql_schema: 'datasets',
        properties: {
          ...properties,
        },
      },
    };
    datasetGrammars.push(datasetGrammar);
  }
  console.log({ datasetGrammars });
  return datasetGrammars;
};

function getDGDefsFromEGDefs(eventGrammarDef: EventGrammarCSVFormat[]) {
  return eventGrammarDef.filter(
    (value) => value.fieldType === FieldType.dimension,
  );
}

export async function getEGDefFromFile(csvFilePath: string) {
  console.log(csvFilePath);
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

async function readCSV(filePath: string): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    const rows: string[][] = [];

    fs1
      .createReadStream(filePath)
      .pipe(csv({ separator: ',', headers: false, quote: "'" }))
      .on('data', (data) => {
        rows.push(Object.values(data));
      })
      .on('end', () => {
        resolve(rows);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

export async function processCsv(input, output) {
  return new Promise((resolve, reject) => {
    if (fs1.existsSync(output)) {
      fs1.unlinkSync(output);
    }
    const readStream = fs1.createReadStream(input);
    const writeStream = fs1.createWriteStream(output);
    const file = readline.createInterface({
      input: readStream,
      output: process.stdout,
      terminal: false,
    });
    file.on('line', (line) => {
      let newline = '';
      for (const letter in line) {
        if (line[letter] == '"') {
          continue;
        } else {
          newline = newline + line[letter];
        }
      }
      writeStream.write(newline + '\r\n');
    });
    file.on('close', async () => {
      await fs1.unlinkSync(input);
      await processSleep(200);
      readStream.close();
      writeStream.end();
      writeStream.on('finish', async () => {
        await fs1.renameSync(output, input);
        resolve(output);
      });
    });
    file.on('error', (err) => {
      reject(err);
    });
  });
}

async function processSleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

export async function removeEmptyLines(filePath: string): Promise<void> {
  const readFileAsync = promisify(fs1.readFile);
  const writeFileAsync = promisify(fs1.writeFile);
  try {
    // Read the file contents
    const data = await readFileAsync(filePath, 'utf-8');

    // Split the file contents into lines and filter out empty lines
    const lines = data.split('\n');
    const nonEmptyLines = lines.filter((line) => line.trim() !== '');

    // Join the non-empty lines back together
    const filteredContents = nonEmptyLines.join('\n');

    // Write the filtered contents back to the file
    await writeFileAsync(filePath, filteredContents);
  } catch (err) {
    console.error('Error processing file:', err);
  }
}
