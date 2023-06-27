import { DimensionGrammar } from 'src/types/dimension';
import {
  Column,
  ColumnType,
  EventGrammarCSVFormat,
  FieldType,
} from '../../types/parser';
import { readCSVFile } from '../utils/csvreader';
const fs = require('fs').promises;

export const createDimensionGrammarFromCSVDefinition = async (
  csvFilePath: string,
): Promise<DimensionGrammar> => {
  // read csvPath
  const [row1, row2, row3] = await readCSVFile(csvFilePath);

  // Naming convention for event is => `<event name>-event.csv`
  // Naming comvention for dimension is => `<dimension name>-dimenstion.csv`
  const dimensionName = csvFilePath
    .split('/')
    .pop()
    .split('.')[0]
    .split('-')[0];

  // Find text "PK" in the first row
  const indexOfPK = row1
    .split(',')
    .map((word: string) => word.trim())
    .indexOf('PK');
  const pk: string = row3.split(',')[indexOfPK];

  // get
  const indexes: string[] = row1
    .split(',')
    .map((value, index) => {
      if (value.trim() === 'Index') return index;
      else return -1;
    })
    .filter((value) => value !== -1)
    .map((value) => row3.split(',').map((word: string) => word.trim())[value]);

  // row 2 and 3
  const dimensionColumns: Column[] = row2.split(',').map((value, index) => {
    return {
      name: row3.split(',').map((word: string) => word.trim())[index],
      type: value.trim() as ColumnType,
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

export const processCSVtoEventGrammarDefJSON = (
  dimensionName: string,
  dimensionGrammarKey: string,
  fieldDataType: string,
  fieldName: string,
  fieldType: string,
): EventGrammarCSVFormat[] => {
  // Vertical columns for CSV File
  // | dimensionName |
  // | dimensionGrammarKey |
  // | fieldDataType |
  // | fieldName |
  // | fieldType |
  return fieldType.split(',').map((value, index) => {
    return {
      dimensionName:
        dimensionName.split(',')[index].trim() === ''
          ? null
          : dimensionName.split(',')[index].trim(),
      dimensionGrammarKey:
        dimensionGrammarKey.split(',')[index].trim() === ''
          ? null
          : dimensionGrammarKey.split(',')[index].trim(),
      fieldDataType: fieldDataType.split(',')[index].trim() as ColumnType,
      fieldName: fieldName.split(',')[index].trim(),
      fieldType: fieldType.split(',')[index].trim() as FieldType,
    };
  });
};

export const getInstrumentField = (
  fieldName: string,
  fieldType: string,
): string => {
  // Find text "metric" in row 5 get it's index and get the value from row 4
  return fieldName.split(',')[
    fieldType
      .split(',')
      .map((word: string) => word.trim())
      .indexOf('metric')
  ];
};

export const mapPropertiesFromColumns = (columns: Column[]): any => {
  const properties = {};
  for (const column of columns) {
    switch (column.type) {
      case 'date':
        properties[column.name] = {
          type: 'string',
          format: 'date',
        };
        break;
      default:
        properties[column.name] = {
          type: column.type,
          unique: true,
        };
    }
  }
  return properties;
};
