import { JSONSchema4 } from 'json-schema';
import { Column, ColumnType } from '../../types/parser';
import {
  createDimensionGrammarFromCSVDefinition,
  getInstrumentField,
  mapPropertiesFromColumns,
  processCSVtoEventGrammarDefJSON,
} from './event-grammar.helpers';
import { createCompositeDimensionGrammar } from '../dimension-grammar/dimension-grammar.helpers';
import { createEventGrammarFromCSVDefinition } from './event-grammar.service';
const fs = require('fs');

describe('EventGrammarService', () => {
  // it('tests createDimensionGrammarFromCSVDefinition', async () => {
  //   const csvFilePath =
  //     './test/fixtures/test-csvs/event-grammars/test-dimension.grammar.csv';

  //   const fileContent = fs.readFileSync(csvFilePath, 'utf8');
  //   console.log('fileContent: ', fileContent.split('\n'));

  //   const data = await createDimensionGrammarFromCSVDefinition(csvFilePath);
  //   console.log('data: ', data);
  //   expect(data).toEqual({
  //     description: '',
  //     name: 'test',
  //     type: 'dynamic',
  //     storage: {
  //       indexes: ['name'],
  //       primaryId: 'state_id',
  //       retention: null,
  //       bucket_size: null,
  //     },
  //     schema: {
  //       title: 'test',
  //       psql_schema: 'dimensions',
  //       properties: {
  //         state_id: { type: 'string', unique: true },
  //         state_name: { type: 'string', unique: true },
  //         latitude: { type: 'string', unique: false },
  //         longitude: { type: 'string', unique: false },
  //       },
  //       indexes: [{ columns: [['state_name']] }],
  //     },
  //   });
  // });

  it('tests for blaklist implementation: ', async () => {
    const data = await createEventGrammarFromCSVDefinition(
      './ingest/programs/rev-and-monitor/block-event.grammar.csv',
      './ingest/dimensions',
      'test_complete_ingestion',
      ['block'],
    );

    expect(data).toEqual([
      {
        file: './ingest/programs/rev-and-monitor/block-event.grammar.csv',
        name: 'test_complete_ingestion_block_district_district_id',
        instrument: { type: 0, name: 'counter' },
        description: '',
        instrument_field: 'meeting_conducted',
        dimension: [
          {
            key: 'district_id',
            dimension: {
              name: {
                name: 'district',
                description: '',
                type: 'dynamic',
                storage: {
                  indexes: ['name'],
                  primaryId: 'district_id',
                  retention: null,
                  bucket_size: null,
                },
                schema: {
                  title: 'district',
                  psql_schema: 'dimensions',
                  properties: {
                    district_id: { type: 'string', unique: true },
                    district_name: { type: 'string', unique: true },
                    state_id: { type: 'string', unique: false },
                    state_name: { type: 'string', unique: false },
                    latitude: { type: 'string', unique: false },
                    longitude: { type: 'string', unique: false },
                  },
                  indexes: [{ columns: [['district_name']] }],
                },
              },
              mapped_to: 'district_id',
            },
          },
        ],
        is_active: true,
        schema: {
          properties: {
            date: { type: 'string', format: 'date' },
            meeting_conducted: { type: 'string', unique: true },
            district_id: { type: 'string', unique: true },
          },
        },
      },
      {
        file: './ingest/programs/rev-and-monitor/block-event.grammar.csv',
        name: 'test_complete_ingestion_block_academicyear_academicyear_id',
        instrument: { type: 0, name: 'counter' },
        description: '',
        instrument_field: 'meeting_conducted',
        dimension: [
          {
            key: 'academicyear_id',
            dimension: {
              name: {
                name: 'academicyear',
                description: '',
                type: 'dynamic',
                storage: {
                  indexes: ['name'],
                  primaryId: 'academicyear_id',
                  retention: null,
                  bucket_size: null,
                },
                schema: {
                  title: 'academicyear',
                  psql_schema: 'dimensions',
                  properties: {
                    academicyear_id: { type: 'string', unique: true },
                    academicyear: { type: 'string', unique: true },
                  },
                  indexes: [{ columns: [['academicyear']] }],
                },
              },
              mapped_to: 'academicyear_id',
            },
          },
        ],
        is_active: true,
        schema: {
          properties: {
            date: { type: 'string', format: 'date' },
            meeting_conducted: { type: 'string', unique: true },
            academicyear_id: { type: 'string', unique: true },
          },
        },
      },
    ]);
  });

  it('tests createCompositeDimensionGrammars', () => {
    const dimensionColumns: Column[] = [
      {
        name: 'state_id',
        type: ColumnType.string,
      },
      {
        name: 'state_name',
        type: ColumnType.string,
      },
      {
        name: 'latitude',
        type: ColumnType.string,
      },
      {
        name: 'longitude',
        type: ColumnType.string,
      },
    ];

    const name = 'state';
    const primaryId = 'state_id';
    const indexes = ['state_name'];

    expect(
      createCompositeDimensionGrammar(
        dimensionColumns,
        name,
        primaryId,
        indexes,
      ),
    ).toEqual({
      description: '',
      name: 'state',
      type: 'dynamic',
      storage: {
        indexes: ['name'],
        primaryId: 'state_id',
        retention: null,
        bucket_size: null,
      },
      schema: {
        title: 'state',
        psql_schema: 'dimensions',
        properties: {
          state_id: { type: 'string', unique: true },
          state_name: { type: 'string', unique: true },
          latitude: { type: 'string', unique: false },
          longitude: { type: 'string', unique: false },
        },
        indexes: [{ columns: [['state_name']] }],
      },
    });
  });

  it('tests processCSVtoEventGrammarDefJSON', () => {
    const dimensionName = 'state,programnishtha,';
    const dimensionGrammarKey = 'state_id,program_name,';
    const fieldDataType = 'string,string,string';
    const fieldName = 'state_id,program_name,total_medium';
    const fieldType = 'dimension,dimension,metric';

    expect(
      processCSVtoEventGrammarDefJSON(
        dimensionName,
        dimensionGrammarKey,
        fieldDataType,
        fieldName,
        fieldType,
      ),
    ).toEqual([
      {
        dimensionName: 'state',
        dimensionGrammarKey: 'state_id',
        fieldDataType: 'string',
        fieldName: 'state_id',
        fieldType: 'dimension',
      },
      {
        dimensionName: 'programnishtha',
        dimensionGrammarKey: 'program_name',
        fieldDataType: 'string',
        fieldName: 'program_name',
        fieldType: 'dimension',
      },
      {
        dimensionName: null,
        dimensionGrammarKey: null,
        fieldDataType: 'string',
        fieldName: 'total_medium',
        fieldType: 'metric',
      },
    ]);

    return;
  });
  it('tests getInstrumentField', () => {
    const fieldName =
      'state_id,grade_diksha,subject_diksha,avg_play_time_in_mins_on_app_and_portal';

    const fieldType = 'dimension,dimension,dimension,metric';

    expect(getInstrumentField(fieldName, fieldType)).toBe(
      'avg_play_time_in_mins_on_app_and_portal',
    );
  });
  it('tests mapPropertiesFromColumns', () => {
    // generate a test case
    const columns: Column[] = [
      {
        name: 'name',
        type: ColumnType.string,
      },
      {
        name: 'age',
        type: ColumnType.integer,
      },
    ];
    const expectedProperties: JSONSchema4 = {
      name: {
        type: 'string',
        unique: true,
      },
      age: {
        type: 'integer',
        unique: true,
      },
    };
    expect(mapPropertiesFromColumns(columns)).toEqual(expectedProperties);
  });
  it('tests mapPropertiesFromColumn with date type', () => {
    // generate a test case here
    const columns: Column[] = [
      {
        name: 'id',
        type: ColumnType.integer,
      },
      {
        name: 'name',
        type: ColumnType.string,
      },
      {
        name: 'date',
        type: ColumnType.date,
      },
    ];
    const properties: JSONSchema4 = {
      ['id' as string]: {
        type: 'integer',
        unique: true,
      },
      name: {
        type: 'string',
        unique: true,
      },
      date: {
        type: 'string',
        format: 'date',
      },
    };
    expect(mapPropertiesFromColumns(columns)).toEqual(properties);
  });
});
