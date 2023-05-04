import { DimensionGrammar } from 'src/types/dimension';
import { Column } from '../../types/parser';
const fs = require('fs').promises;

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
