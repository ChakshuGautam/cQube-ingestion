import { DatasetGrammar, DatasetUpdateRequest, DimensionMapping } from "src/types/dataset";
import { DimensionGrammar } from "src/types/dimension";
import { mockEventGrammar } from "./types.mocks";

export const expectedDimensionGrammar: DimensionGrammar = {
  name: 'cluster',
  description: '',
  type: 'dynamic',
  storage: {
    indexes: ['name'],
    primaryId: 'cluster_id',
    retention: null,
    bucket_size: null,
  },
  schema: {
    title: 'cluster',
    psql_schema: 'dimensions',
    properties: {
      cluster_id: {
        type: 'string',
        unique: true,
      },
      cluster_name: {
        type: 'string',
        unique: true,
      },
      block_id: {
        type: 'string',
        unique: false,
      },
      block_name: {
        type: 'string',
        unique: false,
      },
      district_id: {
        type: 'string',
        unique: false,
      },
      district_name: {
        type: 'string',
        unique: false,
      },
      latitude: {
        type: 'string',
        unique: false,
      },
      longitude: {
        type: 'string',
        unique: false,
      },
    },
    indexes: [
      {
        columns: [['cluster_name']],
      },
    ],
  },
};

export const dimension: DimensionMapping = {
  key: 'testKey', 
  dimension: {
    name: {
      name: 'testName', 
      type: 'testType', 
      storage: {
        indexes: [],
        primaryId: 'testPrimaryId', 
      },
      schema: null,
    },
    mapped_to: 'testMappedTo', 
  },
};

export const datasetUpdateRequest: DatasetUpdateRequest = {
  dataset: {
    name: 'Test Dataset',
    description: 'This is a test dataset',
    dimensions: [dimension],
    schema:{
      type: 'object',
      properties: {
        property1: { type: 'string' },
        property2: { type: 'number' },
      },},
    timeDimension: {
      key: 'timeKey',
      type: 'timeType',
    },
    eventGrammar: mockEventGrammar(),
    tableName: 'test', 
  },
  updateParams: {
    sum: 0, 
    count: 0, 
    avg: 0, 
  },
  filterParams: {},
  dimensionFilter: JSON.stringify({}), 
};


export const datasetGrammar: DatasetGrammar = {
  name: 'Test Dataset',
  description: 'This is a test dataset',
  dimensions: [],
  schema: {
    type: 'object',
    properties: {},
  },
};

export  const grammar: DimensionGrammar = {
  name: 'School',
  type: 'Dynamic',
  storage: {
    indexes: ['name', 'type'],
    primaryId: 'id',
  },
  schema: {
    title: 'School',
    psql_schema: 'dimensions',
    properties: {
      id: { type: 'integer' },
      name: { type: 'string', maxLength: 255 },
      date_created: { type: 'string', format: 'date-time' },
    },
    indexes: [
      { columns: [['name', 'date_created']] },
      { columns: [['name'], ['date_created']] },
    ],
  },
};