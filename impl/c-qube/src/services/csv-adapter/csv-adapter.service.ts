import { Injectable } from '@nestjs/common';
import { JSONSchema4 } from 'json-schema';
import { DataFrame } from 'nodejs-polars';
import { PrismaService } from '../../prisma.service';
import { DimensionGrammar } from 'src/types/dimension';
import { EventGrammar, InstrumentType } from '../../types/event';
import { DimensionService } from '../dimension/dimension.service';
import { DatasetService } from '../dataset/dataset.service';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pl = require('nodejs-polars');

@Injectable()
export class CsvAdapterService {
  constructor(
    public dimensionService: DimensionService,
    public datesetService: DatasetService,
    public prisma: PrismaService,
  ) {}

  async csvToDomainSpec(
    csvPath: string,
    dataFieldColumn: string,
    eventCounterColumns: string[],
  ): Promise<any> {
    // Setup DataFrame
    const df: DataFrame = pl.readCSV(csvPath);
    const allHeaders = df.columns;

    // Can be inferred from the dataFieldColumn
    const dateFieldFrequency = 'Daily';

    const dimensionColumns = allHeaders.filter(
      (h) => h !== dataFieldColumn && !eventCounterColumns.includes(h),
    );

    // Needs User Input
    const isAggregated = true;

    // Generate DimensionGrammar
    const dimensionGrammars = dimensionColumns.map((d) => {
      return {
        name: d,
        description: '',
        type: 'dynamic',
        storage: {
          indexes: ['name'],
          primaryId: 'id',
          retention: null,
          bucket_size: null,
        },
        schema: {
          title: d,
          psql_schema: 'dimensions',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
          },
          indexes: [{ columns: [['name']] }],
        },
      } as DimensionGrammar;
    });

    // Insert DimensionGrammars into the database
    for (let i = 0; i < dimensionGrammars.length; i++) {
      await this.dimensionService.createDimensionGrammar(dimensionGrammars[i]);
      await this.dimensionService.createDimension(dimensionGrammars[i]);
    }

    // Insert Dimensions into the database; Read the CSV and determine the unique values for each dimension
    for (let i = 0; i < dimensionGrammars.length; i++) {
      const uniqueDimensionValues = df
        .select(dimensionGrammars[i].name)
        .unique()
        .dropNulls()
        .rows()
        .map((r, index) => {
          return {
            id: index,
            name: r[0].replace(/^\s+|\s+$/g, '').replace(/['"]+/g, ''),
          };
        });

      await this.dimensionService.insertBulkDimensionData(
        dimensionGrammars[i],
        uniqueDimensionValues,
      );
    }

    // Generate EventGrammar
    const eventGrammars = eventCounterColumns.map((event) => {
      return {
        name: event,
        instrument: {
          type: InstrumentType.COUNTER,
          name: 'counter',
        },
        description: '',
        instrument_field: 'counter',
        is_active: true,
        schema: {
          properties: {
            id: { type: 'string' },
          },
        } as JSONSchema4,
      } as EventGrammar;
    });

    // TODO: Insert EventGrammars into the database

    // Generate DatasetGrammar
    const defaultTimeDimensions = ['Daily', 'Weekly', 'Monthly', 'Yearly'];

    // Generate DatasetGrammars
    // Loop over Dimensions and pick one of time dimensions, pick one of eventGrammars
    // TODO: Insert DatasetGrammars into the database
    for (let i = 0; i < dimensionGrammars.length; i++) {
      for (let j = 0; j < defaultTimeDimensions.length; j++) {
        for (let k = 0; k < eventGrammars.length; k++) {
          const dg = {
            // content_subject_daily_total_interactions
            name: `${dimensionGrammars[i].name}_${defaultTimeDimensions[j]}_${eventGrammars[k].name}`,
            description: '',
            dimensions: [dimensionGrammars[i].name],
          };
        }
      }
    }

    // Insert events into the datasets

    // Divide Headers into 3 groups - EventsCounters, EventSubjects and Dimensions
    // The current criteria is that the name of the headers should contain the word "event" or "dimension"
    // Auto generate Domain Spec from the headers and the types of fields (string, number, boolean)
    // 1. Auto Generate the EventGrammar and DimensionGrammar
    // 2. Auto Generate the Event and Dimensions
    // 3. Auto Generate the DatasetGrammar
    return {};
  }
}
