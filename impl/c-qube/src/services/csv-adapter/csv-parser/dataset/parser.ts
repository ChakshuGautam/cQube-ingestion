import {
  DatasetGrammar,
  DimensionMapping,
  TimeDimension,
} from '../../../../types/dataset';
import { EventGrammar } from 'src/types/event';
import { DimensionGrammar } from '../../../../types/dimension';
import { getEGDefFromFile } from '../eventgrammar/parser';
import { hash } from '../../../../utils/hash';
import { EventGrammarCSVFormat, FieldType } from '../../types/parser';

export const createDatasetGrammarsFromEG = async (
  folderName: string,
  defaultTimeDimensions: string[],
  eventGrammars: EventGrammar[],
): Promise<DatasetGrammar[]> => {
  const datasetGrammars: DatasetGrammar[] = [];

  for (const timeDimension of defaultTimeDimensions) {
    for (const eventGrammar of eventGrammars) {
      const datasetGrammar: DatasetGrammar =
        await createSingleDatasetGrammarsFromEG(
          folderName,
          timeDimension,
          eventGrammar,
          eventGrammar.file,
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

  for (const eventGrammar of eventGrammars) {
    const datasetGrammar: DatasetGrammar =
      await createSingleDatasetGrammarsFromEGWithoutTimeDimension(
        folderName,
        eventGrammar,
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
  return datasetGrammars;
};
