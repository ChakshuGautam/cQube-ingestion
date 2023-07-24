import { Injectable, Logger } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { readCSV } from '../csv-adapter/parser/utils/csvreader';
import * as fs from 'fs';
import { PrismaService } from '../../prisma.service';
import { CsvAdapterService } from '../csv-adapter/csv-adapter.service';
import { DatasetService } from '../dataset/dataset.service';
import { DatasetGrammar, DatasetUpdateRequest } from 'src/types/dataset';
import {
  createCompoundDatasetDataToBeInserted,
  createDatasetDataToBeInserted,
} from '../csv-adapter/parser/dataset/dataset-grammar.helper';
import { Event, EventGrammar, InstrumentType } from '../../types/event';
import { Pipe } from 'src/types/pipe';
import { defaultTransformers } from '../transformer/default.transformers';
import { TransformerContext } from 'src/types/transformer';
import { getDataDifference } from '../csv-adapter/parser/update-diff/update-diff.service';
import { getEGDefFromFile } from '../csv-adapter/parser/event-grammar/event-grammar.service';
import { EventGrammarCSVFormat } from '../csv-adapter/types/parser';
import { QueryBuilderService } from '../query-builder/query-builder.service';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const csv = require('csvtojson');

type DeletionAction = {
  dimension: string;
  datasetName: string;
  affectedValues: string[];
};

@Injectable()
export class DeleteService {
  constructor(
    private readonly csvAdapterService: CsvAdapterService,
    private readonly prisma: PrismaService,
    private readonly datasetService: DatasetService,
    private readonly qbService: QueryBuilderService,
  ) {}

  async updateDatasets(durs: DatasetUpdateRequest[]) {
    const updateQueries = [];

    for (let i = 0; i < durs.length; i++) {
      const dur: DatasetUpdateRequest = durs[i];
      const dataset = dur.dataset;
      const data = dur.updateParams;
      // console.log('dataset: ', dataset);
      // console.log('data: ', data);
      // get the data from dataset table;
      const filters = dur.filterParams;
      // console.log('dataset.filterParams: ', JSON.parse(dataset.filterParams));
      // console.log(typeof dataset.filterParams);
      let where = '';
      Object.keys(filters).forEach((key: string) => {
        where += `${key}='${filters[key]}' AND `;
      });

      where = where.slice(0, -4);
      // console.log('where: ', where);
      updateQueries.push(
        this.qbService.generateUpdateStatement(dataset, data, where),
      );
    }
    // console.log('updateQueries: ', updateQueries);
    fs.writeFileSync(`./sql/${Date.now()}.sql`, updateQueries.join(';\n'));
    return updateQueries;
  }
  async processDatasetUpdateRequest(
    durs: DatasetUpdateRequest[],
  ): Promise<void> {
    const data = [];
    const timeDimensionProperties = durs[0].dataset.timeDimension
      ? this.datasetService.addDateDimension(durs[0].dataset.timeDimension.key)
      : [];

    durs[0].dataset.schema.properties = {
      ...durs[0].dataset.schema.properties,
      ...this.datasetService.counterAggregates(),
      ...this.datasetService.addNonTimeDimension(durs[0].dataset.dimensions[0]),
      ...timeDimensionProperties,
    };

    for (const dur of durs) {
      data.push({ ...dur.updateParams, ...dur.filterParams });
    }
    durs[0].dataset.schema.title = durs[0].dataset.tableName;
    // this will ideally be a row wise update
    // but there will only be one row per dataset table, hence this should be
    // generating update queries and then running a prisma transaction for it
    const updateQueries = await this.updateDatasets(durs); //[0], data);
    // console.log('updateQueries: ', updateQueries);
    await this.prisma.$transaction(
      updateQueries.map((query) => this.prisma.$executeRawUnsafe(query)),
    );
  }
  async deleteData(
    newDataFilePath: string,
    oldDataFilePath: string,
    eventGrammarFilePath: string,
    filter: string,
  ) {
    const { filePath, finalContent } = await getDataDifference(
      oldDataFilePath,
      newDataFilePath,
      eventGrammarFilePath,
      './test/fixtures/test-csvs/update-diff',
    );

    // console.log(filePath, finalContent);
    // figure out row wise metric difference
    // break this difference into two parts 1. Data to be deleted 2. Data to be inserted (will handle update and delete in a combined manner)
    // aggregate this data (using the transformer)
    // pass the transformed thing to query builder for query generation (this will help in figuring out impact area automatically since the insertion areas a figured out automatically)
    // in the query builder there should be a two step process 1. Calculate updated values based on currently inserted values

    const callback = (
      err: any,
      context: TransformerContext,
      events: Event[],
    ) => {
      //console.debug('callback', err, events.length);
    };

    const datasetGrammars: DatasetGrammar[] =
      await this.datasetService.getNonCompoundDatasetGrammars({
        name: filter,
      });

    // console.log(datasetGrammars);
    for (let i = 0; i < datasetGrammars.length; i++) {
      // console.log('in loop for: ', datasetGrammars[i]);

      await createDatasetDataToBeInserted(
        datasetGrammars[i]?.timeDimension?.type,
        datasetGrammars[i],
        filePath,
      )
        .then(async (s) => {
          // console.log(s);
          const events: Event[] = s;

          const pipe: Pipe = {
            event: datasetGrammars[i].eventGrammar,
            transformer: defaultTransformers[1],
            dataset: datasetGrammars[i],
          };

          const transformContext: TransformerContext = {
            dataset: datasetGrammars[i],
            events: events,
            isChainable: false,
            pipeContext: {},
          };

          try {
            if (events && events.length > 0) {
              const datasetUpdateRequest: DatasetUpdateRequest[] =
                pipe.transformer.transformSync(
                  callback,
                  transformContext,
                  events,
                ) as DatasetUpdateRequest[];

              // console.log('datasetUpdateRequest', datasetUpdateRequest[0]);

              if (datasetUpdateRequest.length > 0) {
                await this.processDatasetUpdateRequest(datasetUpdateRequest)
                  .then(() => {
                    // console.log('result in then: ', updateQueries);
                    Logger.verbose(
                      `Ingested without any error ${events.length} events for ${datasetGrammars[i].name}`,
                    );
                  })
                  .catch((err) => {
                    Logger.verbose(
                      `Ingested with error ${events.length} events for ${datasetGrammars[i].name}`,
                    );
                    console.log(err);
                  });
              }
            } else {
              Logger.verbose(
                `No events found for ${datasetGrammars[i].name} dataset`,
              );
            }
          } catch (err) {
            Logger.log('Error while processing deletion', err);
          }
        })
        .catch((err) => {
          Logger.log('Error while processing deletion', err);
        });
    }

    const compoundDatasetGrammars: DatasetGrammar[] =
      await this.datasetService.getCompoundDatasetGrammars({
        name: filter,
      });

    for (let i = 0; i < compoundDatasetGrammars.length; i++) {
      await getEGDefFromFile(compoundDatasetGrammars[i].eventGrammarFile).then(
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
          const events: Event[] = await createCompoundDatasetDataToBeInserted(
            filePath,
            compoundEventGrammar,
            compoundDatasetGrammars[i],
          );
          // Create Pipes
          const pipe: Pipe = {
            event: compoundEventGrammar,
            transformer: defaultTransformers[1],
            dataset: compoundDatasetGrammars[i],
          };
          const transformContext: TransformerContext = {
            dataset: compoundDatasetGrammars[i],
            events: events,
            isChainable: false,
            pipeContext: {},
          };

          if (events && events.length > 0) {
            const datasetUpdateRequest: DatasetUpdateRequest[] =
              pipe.transformer.transformSync(
                callback,
                transformContext,
                events,
              ) as DatasetUpdateRequest[];

            await this.processDatasetUpdateRequest(datasetUpdateRequest)
              .then(() => {
                Logger.verbose(
                  `Ingested Compound Dataset without any error ${events.length} events for ${compoundDatasetGrammars[i].name}`,
                );
              })
              .catch((e) => {
                Logger.verbose(
                  `Ingested Compound Dataset with error ${events.length} events for ${compoundDatasetGrammars[i].name}`,
                );
              });
          } else {
            Logger.verbose(
              `No events found for ${compoundDatasetGrammars[i].name} dataset`,
            );
          }
        },
      );
    }
  }
}
