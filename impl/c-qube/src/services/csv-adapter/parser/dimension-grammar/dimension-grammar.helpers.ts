import { DimensionGrammar } from 'src/types/dimension';
import { Column, ColumnType } from '../../types/parser';
const fs = require('fs').promises;

export const createDimensionGrammarFromCSVDefinition = async (
  csvFilePath: string,
  readFile: (path: string, encoding: string) => Promise<string> = fs.readFile,
): Promise<DimensionGrammar | null> => {
  const fileContent = await readFile(csvFilePath, 'utf-8');
  const [row1, row2, row3] = fileContent.split('\n').map((row) => row.trim());

  if (!isValidCSVFormat(row1, row2, row3)) {
    console.error(`Invalid CSV format for file: ${csvFilePath}`);
    return null;
  }

  const dimensionName = getDimensionNameFromFilePath(csvFilePath);
  const { pk, indexes } = getPrimaryKeyAndIndexes(row1, row3);
  const dimensionColumns = getDimensionColumns(row2, row3);

  const dimensionGrammar = createCompositeDimensionGrammar(
    dimensionColumns,
    dimensionName,
    pk,
    indexes,
  );

  return dimensionGrammar;
};

export const getDimensionNameFromFilePath = (csvFilePath: string): string => {
  return csvFilePath.split('/').pop().split('.')[0].split('-')[0];
};

export const getPrimaryKeyAndIndexes = (
  row1: string,
  row3: string,
): { pk: string; indexes: string[] } => {
  const pk: string =
    row3.split(',')[
    row1
      .split(',')
      .map((word: string) => word.trim())
      .indexOf('PK')
    ];

  const indexes: string[] = row1
    .split(',')
    .map((value, index) => (value.trim() === 'Index' ? index : -1))
    .filter((value) => value !== -1)
    .map((value) => row3.split(',').map((word: string) => word.trim())[value]);

  return { pk, indexes };
};

export const getDimensionColumns = (row2: string, row3: string): Column[] => {
  return row2.split(',').map((value, index) => {
    return {
      name: row3.split(',').map((word: string) => word.trim())[index],
      type: ColumnType[value.trim() as keyof typeof ColumnType],
    };
  });
};

export const isValidCSVFormat = (
  row1: string,
  row2: string,
  row3: string,
): boolean => {
  try {
    // Add validation logic here
    const isValidRow1 = row1.split(',').length >= 1;
    const isValidRow2 = row2.split(',').length >= 1;
    const isValidRow3 = row3.split(',').length >= 1;

    // console.log(
    //   row1.split(',').length,
    //   row2.split(',').length,
    //   row3.split(',').length,
    // );
    // console.log(row2.split(',').length === row3.split(',').length);
    // console.log(row1.split(',').length === row3.split(',').length);

    return (
      isValidRow1 &&
      isValidRow2 &&
      isValidRow3 &&
      row2.split(',').length === row3.split(',').length &&
      row1.split(',').length === row3.split(',').length
    );
  } catch (e) {
    return false;
  }
};

export const createCompositeDimensionGrammar = (
  dimensionColumns: Column[],
  name: string,
  primaryId: string,
  indexes: string[],
): DimensionGrammar => {
  const properties = dimensionColumns.reduce((acc, column) => {
    acc[column.name] = {
      type: column.type,
      unique: indexes.includes(column.name) || column.name === primaryId,
    };
    return acc;
  }, {});

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
