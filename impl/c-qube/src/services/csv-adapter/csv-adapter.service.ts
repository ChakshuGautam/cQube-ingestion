import { Injectable } from '@nestjs/common';
import { JSONSchema4 } from 'json-schema';
import { DataFrame } from 'nodejs-polars';
import { PrismaService } from '../../prisma.service';
import { DimensionGrammar } from 'src/types/dimension';
import { Event, EventGrammar, InstrumentType } from '../../types/event';
import { DimensionService } from '../dimension/dimension.service';
import { DatasetService } from '../dataset/dataset.service';
import { EventService } from '../event/event.service';
import {
  DatasetGrammar,
  DatasetUpdateRequest,
  DimensionMapping,
} from '../../types/dataset';
import { defaultTransformers } from '../transformer/default.transformers';
import { Pipe } from 'src/types/pipe';
import { TransformerContext } from 'src/types/transformer';
import { readFile } from 'fs/promises';
import {
  createDimensionGrammarFromCSVDefinition,
  createEventGrammarFromCSVDefinition,
} from './csv-adapter.utils';
import { readdirSync } from 'fs';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs').promises;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pl = require('nodejs-polars');

enum ColumnType {
  string = 'string',
  integer = 'integer',
  float = 'float',
}

export type Column = {
  name: string;
  type: ColumnType;
};

@Injectable()
export class CsvAdapterService {
  constructor(
    public dimensionService: DimensionService,
    public eventService: EventService,
    public datasetService: DatasetService,
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

    const Columns = allHeaders.filter(
      (h) =>
        h !== dataFieldColumn &&
        !eventCounterColumns.includes(h) &&
        h.length > 0,
    );

    // Needs User Input
    const isAggregated = true;

    // Generate DimensionGrammar
    const dimensionGrammars: DimensionGrammar[] =
      this.getDimensionGrammars(Columns);

    // Insert DimensionGrammars into the database
    await Promise.all(
      dimensionGrammars.map((x) =>
        this.dimensionService.createDimensionGrammar(x),
      ),
    );

    // Insert Dimensions into the database
    await Promise.all(
      dimensionGrammars.map((x) => this.dimensionService.createDimension(x)),
    );

    await this.insertDimensionData(dimensionGrammars, df);

    // Generate EventGrammar
    const eventGrammars: EventGrammar[] = this.generateEventGrammar(
      eventCounterColumns,
      dimensionGrammars,
    );
    // TODO: Insert EventGrammars into the database

    // Generate DatasetGrammar
    const defaultTimeDimensions = ['Daily', 'Weekly', 'Monthly', 'Yearly'];

    // Generate DatasetGrammars
    // Loop over Dimensions and pick one of time dimensions, pick one of eventGrammars
    const datasetGrammars: DatasetGrammar[] = this.generateDatasetGrammars(
      dimensionGrammars,
      defaultTimeDimensions,
      eventCounterColumns,
    );

    // Insert DatasetGrammars into the database
    await Promise.all(
      datasetGrammars.map((x) => this.datasetService.createDatasetGrammar(x)),
    );

    await Promise.all(
      datasetGrammars.map((x) => this.datasetService.createDataset(x)),
    );

    // Create Pipes
    const pipe: Pipe = {
      event: eventGrammars[0],
      transformer: defaultTransformers[0],
      dataset: datasetGrammars[0],
    };

    // TODO: Insert Pipes into the database

    // Generate Events for pipe
    const events: Event[] = df
      .select('dimensions_pdata_id', 'total_interactions', 'Date')
      .map((x) => {
        return {
          spec: eventGrammars[0],
          data: {
            name: x[0],
            counter: parseInt(x[1]),
            date: x[2],
          },
        };
      });

    // console.log(events.length, JSON.stringify(events[0], null, 2));

    // Insert events into the datasets
    const callback = (
      err: any,
      context: TransformerContext,
      events: Event[],
    ) => {
      //console.debug('callback', err, events.length);
    };

    const transformContext: TransformerContext = {
      dataset: datasetGrammars[0],
      events: events,
      isChainable: false,
      pipeContext: {},
    };
    const datasetUpdateRequest: DatasetUpdateRequest[] =
      pipe.transformer.transformSync(
        callback,
        transformContext,
        events,
      ) as DatasetUpdateRequest[];

    // console.log(datasetUpdateRequest.length, datasetUpdateRequest[0]);
    this.datasetService.processDatasetUpdateRequest(datasetUpdateRequest);

    return {};
  }

  public generateDatasetGrammars(
    dimensionGrammars: DimensionGrammar[],
    defaultTimeDimensions: string[],
    eventCounterColumns: string[],
  ): DatasetGrammar[] {
    const datasetGrammars: DatasetGrammar[] = [];
    for (let i = 0; i < dimensionGrammars.length; i++) {
      for (let j = 0; j < defaultTimeDimensions.length; j++) {
        for (let k = 0; k < eventCounterColumns.length; k++) {
          const dimensionMapping: DimensionMapping[] = [];
          dimensionMapping.push({
            key: `${dimensionGrammars[i].name}`,
            dimension: {
              name: dimensionGrammars[i],
              mapped_to: `${dimensionGrammars[i].name}`,
            },
          });
          const dataserGrammar: DatasetGrammar = {
            // content_subject_daily_total_interactions
            name: `${dimensionGrammars[i].name}_${defaultTimeDimensions[j]}_${eventCounterColumns[k]}`,
            description: '',
            dimensions: dimensionMapping,
            schema: {
              title: `${dimensionGrammars[i].name}_${defaultTimeDimensions[j]}_${eventCounterColumns[k]}`,
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
  }

  public generateEventGrammar(
    eventCounterColumns: string[],
    dimensionGrammars: DimensionGrammar[],
  ) {
    const eventGrammars: EventGrammar[] = [];
    for (let i = 0; i < dimensionGrammars.length; i++) {
      for (let j = 0; j < eventCounterColumns.length; j++) {
        const eventName = `${dimensionGrammars[i].name}_${eventCounterColumns[j]}`;
        const eventGrammar: EventGrammar = {
          name: eventName,
          instrument: {
            type: InstrumentType.COUNTER,
            name: 'counter',
          },
          description: '',
          instrument_field: 'counter',
          dimension: {
            key: '',
            dimension: {
              name: dimensionGrammars[i],
              mapped_to: `${dimensionGrammars[i].name}`,
            },
          } as DimensionMapping,
          is_active: true,
          schema: {
            properties: {
              id: { type: 'string' },
            },
          } as JSONSchema4,
        } as EventGrammar;

        eventGrammars.push(eventGrammar);
      }
    }
    return eventGrammars;
  }

  public async insertDimensionData(
    dimensionGrammars: DimensionGrammar[],
    df: DataFrame,
  ) {
    const insertDimensionDataPromises = [];

    // Read the CSV and determine the unique values for each dimension
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

      insertDimensionDataPromises.push(
        this.dimensionService.insertBulkDimensionData(
          dimensionGrammars[i],
          uniqueDimensionValues,
        ),
      );
    }
    await Promise.all(insertDimensionDataPromises);
  }

  public getDimensionGrammars(Columns: string[]): DimensionGrammar[] {
    return Columns.map((d) => {
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
            name: { type: 'string', unique: true },
          },
          indexes: [{ columns: [['name']] }],
        },
      } as DimensionGrammar;
    });
  }

  public async ingest() {
    await this.nuke();

    // Parse the config
    const ingestionFolder = './ingest';
    const config = JSON.parse(
      await readFile(ingestionFolder + '/config.json', 'utf8'),
    );
    const regexDimensionGrammar = /\-dimension\.grammar.csv$/i;
    for (let j = 0; j < config?.programs.length; j++) {
      const inputFiles = readdirSync(config?.programs[j].input?.files);
      for (let i = 0; i < inputFiles?.length; i++) {
        if (regexDimensionGrammar.test(inputFiles[i])) {
          // Getting the data from the CSV files
          // const data = await fs.readFile(
          //   config?.programs[0].input?.files + `/${inputFiles[i]}`,
          //   'utf8',
          // );
          const dimensionGrammar =
            await createDimensionGrammarFromCSVDefinition(
              config?.programs[j].input?.files + `/${inputFiles[i]}`,
            );
          await this.dimensionService.createDimension(dimensionGrammar);
          await this.dimensionService.createDimensionGrammar(dimensionGrammar);
        }
      }
    }

    // Ingesting the Event
    const regexEventGrammar = /\-event\.grammar.csv$/i;
    for (let j = 0; j < config?.programs.length; j++) {
      const inputFiles = readdirSync(config?.programs[j].input?.files);
      for (let i = 0; i < inputFiles?.length; i++) {
        if (regexEventGrammar.test(inputFiles[i])) {
          // console.log(config?.programs[j].input?.files + `/${inputFiles[i]}`);
          const eventGrammar = await createEventGrammarFromCSVDefinition(
            config?.programs[j].input?.files + `/${inputFiles[i]}`,
            config?.programs[j].input?.files,
          );
          console.log(eventGrammar);
          await this.eventService.createEventGrammar(eventGrammar);
        }
      }
    }

    // Create a function to get all files in the folder
    // Create a function to use regex to match the files

    //   Ingest DimensionGrammar
    //   -- Get all files that match the regex
    //   -- Invoke createDimensionGrammarFromCSVDefinition with filePath
    //   -- Insert them into DB - L79 for this file
    //   Ingest EventGrammar
    //   -- Get all files that match the regex
    //   -- Read the CSV
    //   Ingest DatasetGrammar
    //   -- Generate Datasets using the DimensionGrammar and EventGrammar
    //   -- Insert them into DB

    // Ingest Data
    //   Ingest DimensionData
    //   -- Get all files that match the regex
    //   -- Read the CSV
    //   Ingest EventData
    //   -- Get all files that match the regex
    //   -- Read the CSV
  }

  public async nuke() {
    try {
      await this.prisma.$executeRawUnsafe(
        `TRUNCATE table spec."DimensionGrammar" CASCADE;`,
      );
      await this.prisma.$executeRawUnsafe(
        `TRUNCATE table spec."DatasetGrammar" CASCADE;`,
      );
      await this.prisma.$executeRawUnsafe(
        `TRUNCATE table spec."EventGrammar" CASCADE;`,
      );

      const dimensions: any[] = await this.prisma
        .$queryRaw`select 'drop table if exists "' || tablename || '" cascade;'
        from pg_tables where schemaname = 'dimensions';`;
      for (let i = 0; i < dimensions.length; i++) {
        const parts = dimensions[i]['?column?'].split('"');
        const query = parts[0] + '"dimensions"."' + parts[1] + '"' + parts[2];
        await this.prisma.$executeRawUnsafe(query);
      }

      const datasets: any[] = await this.prisma
        .$queryRaw`select 'drop table if exists "' || tablename || '" cascade;'
        from pg_tables where schemaname = 'datasets';`;
      for (let i = 0; i < datasets.length; i++) {
        const parts = datasets[i]['?column?'].split('"');
        const query = parts[0] + '"datasets"."' + parts[1] + '"' + parts[2];
        await this.prisma.$executeRawUnsafe(query);
      }
    } catch (e) {
      console.error(e);
    }
  }
}
