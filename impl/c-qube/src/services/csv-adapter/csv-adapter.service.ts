import { Logger, Injectable } from '@nestjs/common';
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
import { isTimeDimensionPresent } from './csv-adapter.utils';
import { readdirSync } from 'fs';
import { logToFile } from '../../utils/debug';
import { spinner } from '@clack/prompts';
import { retryPromiseWithDelay } from '../../utils/retry';
import {
  getFilesInDirectory,
  processCsv,
  removeEmptyLines,
} from './csv-parser/utils/csvcleaner';
import {
  createCompoundDatasetDataToBeInserted,
  createDatasetDataToBeInserted,
} from './csv-parser/dataset/helper';
import {
  createEventGrammarFromCSVDefinition,
  getEGDefFromFile,
} from './csv-parser/eventgrammar/parser';
import {
  createCompoundDatasetGrammars,
  createCompoundDatasetGrammarsWithoutTimeDimensions,
  createDatasetGrammarsFromEG,
  createDatasetGrammarsFromEGWithoutTimeDimension,
} from './csv-parser/dataset/parser';
import { createDimensionGrammarFromCSVDefinition } from './csv-parser/dimensiongrammar/parser';
import { EventGrammarCSVFormat } from './types/parser';
const chalk = require('chalk');
const fs = require('fs').promises;
const pl = require('nodejs-polars');
const _ = require('lodash');
const pLimit = require('p-limit');
const limit = pLimit(10);

@Injectable()
export class CsvAdapterService {
  private readonly logger: Logger = new Logger(CsvAdapterService.name);
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
    const df: DataFrame = pl.readCSV(csvPath, {
      quoteChar: "'",
      ignoreErrors: true,
    });
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
            timeDimension: {
              key: 'date',
              type: 'Daily',
            },
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
          dimension: [
            {
              key: '',
              dimension: {
                name: dimensionGrammars[i],
                mapped_to: `${dimensionGrammars[i].name}`,
              },
            },
          ] as DimensionMapping[],
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
    const s = spinner();
    s.start('🚧 1. Deleting Old Data');
    await this.nuke();
    s.stop('✅ 1. The Data has been Nuked');

    let datasetGrammarsGlobal: DatasetGrammar[] = [];

    // Parse the config
    s.start('🚧 2. Reading your config');
    const ingestionFolder = './ingest';
    const config = JSON.parse(
      await readFile(ingestionFolder + '/config.json', 'utf8'),
    );
    const regexEventGrammar = /\-event\.grammar.csv$/i;
    const defaultTimeDimensions = ['Daily', 'Weekly', 'Monthly', 'Yearly'];
    s.stop('✅ 2. Config parsing completed');

    // Verify all file names
    // TODO: Check if there is no random file name outside of regexes.

    // Verify all string values in all files
    // TODO: It needs to be a closed loop. This should be the first check for the CSV files. Headers should all match.

    //   Ingest DimensionGrammar
    //   -- Get all files that match the regex
    //   -- Invoke createDimensionGrammarFromCSVDefinition with filePath
    //   -- Insert them into DB - L79 for this file
    s.start('🚧 3. Processing Dimensions');
    const insertDimensionDataPromises = [];
    const dimensions: DimensionGrammar[] = [];
    const dimensionGrammarFolder = config?.dimensions.input?.files;
    const regexDimensionGrammar = /\-dimension\.grammar.csv$/i;
    const inputFilesForDimensions = readdirSync(dimensionGrammarFolder);
    for (let i = 0; i < inputFilesForDimensions?.length; i++) {
      // Create a function to get all files in the folder
      // Create a function to use regex to match the file
      if (regexDimensionGrammar.test(inputFilesForDimensions[i])) {
        const currentDimensionGrammarFileName =
          dimensionGrammarFolder + `/${inputFilesForDimensions[i]}`;
        const dimensionGrammar = await createDimensionGrammarFromCSVDefinition(
          currentDimensionGrammarFileName,
        );
        const dimensionDataFileName = currentDimensionGrammarFileName.replace(
          'grammar',
          'data',
        );
        const df: DataFrame = pl.readCSV(dimensionDataFileName, {
          quoteChar: "'",
          ignoreErrors: true,
        });
        dimensions.push(dimensionGrammar);
        await this.dimensionService
          .createDimensionGrammar(dimensionGrammar)
          .then((s) => {
            // console.info(
            //   chalk.blue('Added Dimension Spec!', dimensionGrammar.name),
            // );
          })
          .catch((e) => {
            console.info(
              chalk.blue(
                'Error in adding Dimension Spec!',
                dimensionGrammar.name,
                e,
              ),
            );
          });
        await this.dimensionService
          .createDimension(dimensionGrammar)
          .then((s) => {
            // console.info(
            //   chalk.blue('Added Dimension Table!', dimensionGrammar.name),
            // );
          })
          .catch((e) => {
            console.log(e);
            console.info(
              chalk.blue(
                'Error in adding Dimension Table!',
                dimensionGrammar.name,
              ),
            );
          });

        const allHeaders = df.columns;
        // Ingest Data
        //   Ingest DimensionData
        //   -- Get all files that match the regex
        //   -- Read the CSV
        insertDimensionDataPromises.push(
          this.dimensionService
            .insertBulkDimensionDataV2(
              dimensionGrammar,
              df.rows().map((r, index) => {
                const data = {};
                for (let i = 0; i < allHeaders.length; i++) {
                  data[allHeaders[i]] = r[i];
                }
                return {
                  id: index,
                  ...data,
                };
              }),
            )
            .then((s) => {
              // console.log(
              //   chalk.blue('Added Dimension Data!', dimensionGrammar.name),
              // );
            })
            .catch((e) => {
              console.error('Error in adding', dimensionGrammar.name);
            }),
        );
      }
    }

    await Promise.all(insertDimensionDataPromises);
    s.stop('✅ 3. Dimensions have been ingested');

    //   Ingest EventGrammar
    //   -- Get all files that match the regex
    //   -- Read the CSV
    s.start('🚧 4. Processing Event Grammars');
    const eventGrammarsGlobal: EventGrammar[] = [];
    for (let j = 0; j < config?.programs.length; j++) {
      const inputFiles = readdirSync(config?.programs[j].input?.files);
      // For 1TimeDimension + 1EventCounter + 1Dimension
      for (let i = 0; i < inputFiles?.length; i++) {
        if (regexEventGrammar.test(inputFiles[i])) {
          // console.log(config?.programs[j].input?.files + `/${inputFiles[i]}`);
          const eventGrammarFileName =
            config?.programs[j].input?.files + `/${inputFiles[i]}`;
          // console.log(eventGrammarFileName);
          const ifTimeDimensionPresent = await isTimeDimensionPresent(
            eventGrammarFileName,
          );
          const eventGrammar = await createEventGrammarFromCSVDefinition(
            eventGrammarFileName,
            dimensionGrammarFolder,
            config?.programs[j].namespace,
          );
          eventGrammarsGlobal.push(...eventGrammar);
          for (let i = 0; i < eventGrammar.length; i++) {
            eventGrammar[i].program = config.programs[j].namespace;
            await this.eventService
              .createEventGrammar(eventGrammar[i])
              .catch((e) => {
                console.error(e);
              });
          }
          if (ifTimeDimensionPresent) {
            const dgs1 = await createDatasetGrammarsFromEG(
              config.programs[j].namespace,
              defaultTimeDimensions,
              eventGrammar,
            );
            datasetGrammarsGlobal.push(...dgs1);
          } else {
            const dgs2 = await createDatasetGrammarsFromEGWithoutTimeDimension(
              config.programs[j].namespace,
              eventGrammar,
            );
            datasetGrammarsGlobal.push(...dgs2);
          }
        }
      }
    }
    s.stop('✅ 4. Event Grammars have been ingested');

    // Create EventGrammars for Whitelisted Compound Dimensions
    // For 1TimeDimension + 1EventCounter + (1+Dimensions)
    s.start('🚧 5. Processing Dataset Grammars');
    const compoundDatasetGrammars: {
      dg: DatasetGrammar;
      egFile: string;
    }[] = [];
    for (let j = 0; j < config?.programs.length; j++) {
      const inputFiles = readdirSync(config?.programs[j].input?.files);
      for (let i = 0; i < inputFiles?.length; i++) {
        const compoundDimensions: string[] =
          config.programs[j].dimensions.whitelisted;
        for (let k = 0; k < compoundDimensions.length; k++) {
          const eventGrammarFiles = [];
          const compoundDimensionsToBeInEG = compoundDimensions[k].split(',');
          // Find relevant Event Grammar Files that include all compound dimensions
          if (regexEventGrammar.test(inputFiles[i])) {
            // console.log(config?.programs[j].input?.files + `/${inputFiles[i]}`);
            const filePathForEventGrammar =
              config?.programs[j].input?.files + `/${inputFiles[i]}`;
            const fileContentForEventGrammar = await fs.readFile(
              filePathForEventGrammar,
              'utf-8',
            );
            const dimensionsInEG = fileContentForEventGrammar
              .split('\n')[0]
              .split(',')
              .filter((x) => x !== '');

            if (
              compoundDimensionsToBeInEG.every(
                (x) => dimensionsInEG.indexOf(x) > -1,
              )
            ) {
              // console.error({
              //   compoundDimensionsToBeInEG,
              //   dimensionsInEG,
              //   filePathForEventGrammar,
              // });
              eventGrammarFiles.push(filePathForEventGrammar);
            }
          }
          //iterate over all defaultTimeDimension
          if (eventGrammarFiles.length > 0) {
            const egfWithTD = [];
            const egfWithoutTD = [];
            for (
              let egfIndex = 0;
              egfIndex < eventGrammarFiles.length;
              egfIndex++
            ) {
              if (await isTimeDimensionPresent(eventGrammarFiles[egfIndex])) {
                egfWithTD.push(eventGrammarFiles[egfIndex]);
              } else {
                egfWithoutTD.push(eventGrammarFiles[egfIndex]);
              }
            }
            const allExistingDGs =
              await this.datasetService.getCompoundDatasetGrammars({});
            const hashTable = {};
            for (let i = 0; i < allExistingDGs.length; i++) {
              // Table Name = program_name_<hash>
              // Expanded Table Name = program_name_0X0Y0Z0T
              // Hashtable = {<hash>: 0X0Y0Z0T}
              const allParts = allExistingDGs[i].tableName.split(_);
              const allPartsExpanded =
                allExistingDGs[i].tableNameExpanded.split(_);
              hashTable[allParts[allParts.length - 1]] =
                allPartsExpanded[allPartsExpanded.length - 1];
            }
            const dgsCompoundWithoutTD: DatasetGrammar[] =
              await createCompoundDatasetGrammarsWithoutTimeDimensions(
                config.programs[j].namespace,
                compoundDimensionsToBeInEG,
                dimensions,
                _.uniq(egfWithoutTD),
                hashTable,
              );
            datasetGrammarsGlobal.push(...dgsCompoundWithoutTD);
            for (let m = 0; m < dgsCompoundWithoutTD.length; m++) {
              compoundDatasetGrammars.push({
                dg: dgsCompoundWithoutTD[m],
                egFile: egfWithoutTD[m], //TODO: Hack - fix this; Don't know why this works.
              });
            }
            // console.log({ egfWithTD, egfWithoutTD, dgsCompoundWithoutTD });

            for (let l = 0; l < defaultTimeDimensions.length; l++) {
              const allExistingDGs =
                await this.datasetService.getCompoundDatasetGrammars({});
              const hashTable = {};
              for (let i = 0; i < allExistingDGs.length; i++) {
                // Table Name = program_name_<hash>
                // Expanded Table Name = program_name_0X0Y0Z0T
                // Hashtable = {<hash>: 0X0Y0Z0T}
                const allParts = allExistingDGs[i].tableName.split(_);
                const allPartsExpanded =
                  allExistingDGs[i].tableNameExpanded.split(_);
                hashTable[allParts[allParts.length - 1]] =
                  allPartsExpanded[allPartsExpanded.length - 1];
              }
              const dgsCompoundWithTD: DatasetGrammar[] =
                await createCompoundDatasetGrammars(
                  config.programs[j].namespace,
                  defaultTimeDimensions[l],
                  compoundDimensionsToBeInEG,
                  dimensions,
                  _.uniq(egfWithTD),
                  hashTable,
                );

              datasetGrammarsGlobal.push(...dgsCompoundWithTD);
              for (let m = 0; m < dgsCompoundWithTD.length; m++) {
                compoundDatasetGrammars.push({
                  dg: dgsCompoundWithTD[m],
                  egFile: egfWithTD[m], //TODO: Hack - fix this; Don't know why this works.
                });
              }
            }
          }
        }
      }
    }
    datasetGrammarsGlobal = _.uniqBy(datasetGrammarsGlobal, 'name');

    logToFile(
      'datasetGrammars',
      datasetGrammarsGlobal.map((i) => i.name),
      'datasetGrammars.file',
    );

    // console.log(
    //   datasetGrammarsGlobal.map((i) => {
    //     return { name: i.tableName, expanded: i.tableNameExpanded };
    //   }),
    // );

    //   Ingest DatasetGrammar
    //   -- Generate Datasets using the DimensionGrammar and EventGrammar
    //   -- Insert them into DB
    await Promise.all(
      datasetGrammarsGlobal.map((x) =>
        retryPromiseWithDelay(
          this.datasetService.createDatasetGrammar(x),
          20,
          5000,
        ),
      ),
    );

    // Create Empty Dataset Tables
    await Promise.all(
      datasetGrammarsGlobal.map((x) =>
        retryPromiseWithDelay(this.datasetService.createDataset(x), 20, 5000),
      ),
    );

    s.stop('✅ 5. Dataset Grammars have been ingested');
    // Insert events into the datasets
  }

  public async ingestData(filter: any) {
    // const s = spinner();
    // s.start('🚧 1. Deleting Old Data');
    // await this.nukeDatasets();
    // s.stop('✅ 1. The Data has been Nuked');

    // iterate over all *.data.csv files inside programs folder
    const files = getFilesInDirectory('./ingest/programs');

    let promises = [];
    for (let i = 0; i < files.length; i++) {
      promises.push(
        processCsv(files[i], files[i].split('.csv')[0] + '_temp.csv'),
      );
    }
    await Promise.all(promises);
    promises = [];
    for (let i = 0; i < files.length; i++) {
      promises.push(removeEmptyLines(files[i]));
    }
    await Promise.all(promises);
    this.logger.verbose(`Cleaned all files`);

    // Insert events into the datasets
    const callback = (
      err: any,
      context: TransformerContext,
      events: Event[],
    ) => {
      //console.debug('callback', err, events.length);
    };

    // s.start('🚧 1. Ingest Events');
    promises = [];
    const datasetGrammars: DatasetGrammar[] =
      await this.datasetService.getNonCompoundDatasetGrammars(filter);

    for (let i = 0; i < datasetGrammars.length; i++) {
      // EventGrammar doesn't include anything other thatn the fields
      // that are actually required.
      promises.push(
        limit(() =>
          createDatasetDataToBeInserted(
            datasetGrammars[i]?.timeDimension?.type,
            datasetGrammars[i],
          ).then(async (s) => {
            const events: Event[] = s;
            // Create Pipes
            // console.log(events[0].data, events.length);
            const pipe: Pipe = {
              event: datasetGrammars[i].eventGrammar,
              transformer: defaultTransformers[0],
              dataset: datasetGrammars[i],
            };
            const transformContext: TransformerContext = {
              dataset: datasetGrammars[i],
              events: events,
              isChainable: false,
              pipeContext: {},
            };

            try {
              if (events.length > 0) {
                const datasetUpdateRequest: DatasetUpdateRequest[] =
                  pipe.transformer.transformSync(
                    callback,
                    transformContext,
                    events,
                  ) as DatasetUpdateRequest[];
                // console.log(datasetUpdateRequest.length, datasetUpdateRequest[0]);
                if (datasetUpdateRequest.length > 0) {
                  await this.datasetService
                    .processDatasetUpdateRequest(datasetUpdateRequest)
                    .then(() => {
                      this.logger.verbose(
                        `Ingested without any error ${events.length} events for ${datasetGrammars[i].name}`,
                      );
                    })
                    .catch((e) => {
                      this.logger.verbose(
                        `Ingested with error ${events.length} events for ${datasetGrammars[i].name}`,
                      );
                    });
                } else {
                  // No events
                  this.logger.warn(`No events for ${datasetGrammars[i].name}`);
                }
              }
            } catch (e) {
              console.error(e);
            }
          }),
        ),
      );
    }

    const compoundDatasetGrammars: DatasetGrammar[] =
      await this.datasetService.getCompoundDatasetGrammars(filter);

    // Ingest Compound DatasetGrammar
    for (let m = 0; m < compoundDatasetGrammars.length; m++) {
      promises.push(
        limit(() =>
          getEGDefFromFile(compoundDatasetGrammars[m].eventGrammarFile).then(
            async (s) => {
              const {
                instrumentField,
              }: {
                eventGrammarDef: EventGrammarCSVFormat[];
                instrumentField: string;
              } = s;
              const compoundEventGrammar: EventGrammar = {
                name: '',
                description: '',
                dimension: [],
                instrument_field: instrumentField,
                is_active: true,
                schema: {},
                instrument: {
                  type: InstrumentType.COUNTER,
                  name: 'counter',
                },
              };
              const events: Event[] =
                await createCompoundDatasetDataToBeInserted(
                  compoundDatasetGrammars[m].eventGrammarFile.replace(
                    'grammar',
                    'data',
                  ),
                  compoundEventGrammar,
                  compoundDatasetGrammars[m],
                );
              // Create Pipes
              const pipe: Pipe = {
                event: compoundEventGrammar,
                transformer: defaultTransformers[0],
                dataset: compoundDatasetGrammars[m],
              };
              const transformContext: TransformerContext = {
                dataset: compoundDatasetGrammars[m],
                events: events,
                isChainable: false,
                pipeContext: {},
              };
              if (events.length > 0) {
                const datasetUpdateRequest: DatasetUpdateRequest[] =
                  pipe.transformer.transformSync(
                    callback,
                    transformContext,
                    events,
                  ) as DatasetUpdateRequest[];

                // console.log(datasetUpdateRequest.length, datasetUpdateRequest[0]);

                await this.datasetService
                  .processDatasetUpdateRequest(datasetUpdateRequest)
                  .then(() => {
                    this.logger.verbose(
                      `Ingested Compound Dataset without any error ${events.length} events for ${compoundDatasetGrammars[m].name}`,
                    );
                  })
                  .catch((e) => {
                    this.logger.verbose(
                      `Ingested Compound Dataset with error ${events.length} events for ${compoundDatasetGrammars[m].name}`,
                    );
                  });
              } else {
                console.error(
                  'No relevant events for this dataset',
                  compoundDatasetGrammars[m].name,
                );
              }
            },
          ),
        ),
      );
    }
    await Promise.all(promises);
    // s.stop('🚧 4. Ingest Events');
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

  public async nukeDatasets(filter: any) {
    try {
      const promises = [];
      this.logger.log('Starting delete');

      const query = `
          SELECT 'TRUNCATE TABLE "' || tablename || '" CASCADE;'
          FROM pg_tables
          WHERE schemaname = 'datasets'
          AND tablename ILIKE '%${filter.name}%';`;

      const datasets: any[] = await this.prisma.$queryRawUnsafe(`${query}`);
      this.logger.log('step 1 done');
      for (let i = 0; i < datasets.length; i++) {
        const parts = datasets[i]['?column?'].split('"');
        const query = parts[0] + '"datasets"."' + parts[1] + '"' + parts[2];
        promises.push(this.prisma.$executeRawUnsafe(query));
      }
      await Promise.all(promises).then((results) => {
        this.logger.log(`step 2 done ${results.length} datasets truncated`);
      });
    } catch (e) {
      console.error(e);
    }
  }
}
