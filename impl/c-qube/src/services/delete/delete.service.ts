import { Injectable, Logger } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { readCSV } from '../csv-adapter/parser/utils/csvreader';
import * as fs from 'fs';
import { PrismaService } from '../../prisma.service';
import { CsvAdapterService } from '../csv-adapter/csv-adapter.service';
import { DatasetService } from '../dataset/dataset.service';
import { DatasetGrammar, DatasetUpdateRequest } from 'src/types/dataset';
import { createDatasetDataToBeInserted } from '../csv-adapter/parser/dataset/dataset-grammar.helper';
import { Event } from 'src/types/event';
import { Pipe } from 'src/types/pipe';
import { defaultTransformers } from '../transformer/default.transformers';
import { TransformerContext } from 'src/types/transformer';
import { getDataDifference } from '../csv-adapter/parser/update-diff/update-diff.service';
import { filter } from 'rxjs';
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
      console.log('where: ', where);

      const currentData: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT * FROM ${dataset.schema.psql_schema}.${dataset.tableName} WHERE ${where}`,
      );

      console.log('currentData: ', currentData);

      if (currentData.length > 1) {
        throw new Error('More than one row found for the given filter params');
      }

      const newSum = currentData[0].sum + data.sum;
      const newCount =
        currentData[0].count +
        data.count -
        2 * (data as unknown as any).negcount;
      const newAvg = (newSum / newCount).toPrecision(2);
      console.log('newData', [
        {
          sum: newSum,
          count: newCount,
          avg: newAvg,
        },
      ]);

      updateQueries.push(`UPDATE ${dataset.schema.psql_schema}.${dataset.tableName} 
      SET sum=${newSum}, count=${newCount}, avg=${newAvg}
      WHERE ${where}`);
    }
    // console.log('updateQueries: ', updateQueries);
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

    await this.prisma.$transaction(
      updateQueries.map((query) => this.prisma.$executeRawUnsafe(query)),
    );
  }
  async deleteData(
    newDataFilePath?: string,
    oldDataFilePath?: string,
    eventGrammarFilePath?: string,
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
        name: 'diksha_avg_',
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
          console.log(s);
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
  }

  async processDeletion() {
    // read the event grammar file
    await this.processDeletionFile(
      './update/programs/diksha/avgplaytime-event.delete.csv',
      './ingest/programs/diksha/avgplaytime-event.grammar.csv',
      'diksha',
      './ingest/config.json',
    );
  }

  async processUpdation() {
    await this.processUpdateFile(
      './update/programs/diksha/avgplaytime-event.update.csv',
      './ingest/programs/diksha/avgplaytime-event.data.csv',
    );
  }

  private async processDeletionFile(
    deletionFilePath: string,
    eventGrammarFileName: string,
    programName: string,
    configFilePath: string,
  ) {
    // reading the config
    const config = JSON.parse(
      await readFile(configFilePath, { encoding: 'utf-8' }),
    );
    // read the event grammar file
    const eventGrammar = await readCSV(eventGrammarFileName);

    let metricIdx = -1;
    eventGrammar[4].forEach((element, index) => {
      if (element.trim() === 'metric') metricIdx = index;
    });

    const affectedDimensions: { [k: string]: DeletionAction } = {};
    for (let i = 0; i < eventGrammar[0].length; i++) {
      if (eventGrammar[4][i].trim() === 'dimension') {
        affectedDimensions[eventGrammar[1][i]] = {
          dimension: eventGrammar[1][i],
          datasetName: `${programName}_${eventGrammar[3][metricIdx]}_${eventGrammar[0][i]}`,
          affectedValues: [],
        };
      }
    }

    // process the delete action file
    // const deleteActionData = await readCSV(eventActionFilePath);
    const deleteActionData = await csv().fromFile(deletionFilePath);

    // find unique dimensions which are affected
    deleteActionData.forEach((row) => {
      Object.keys(affectedDimensions).forEach((dimension) => {
        affectedDimensions[dimension].affectedValues.push(row[dimension]);
      });
    });

    // create and run deletion queries
    await this.createAndRunDeletionQueries(affectedDimensions);
    // create and run insertion queries for the affected dimensions
    await this.createUpdatedFileToIngest(
      './ingest/programs/diksha/avgplaytime-event.data.csv',
      './update/programs/diksha/avgplaytime-event.delete.csv',
    );
    return;
  }

  private async createAndRunDeletionQueries(affectedDimensions) {
    const queries = [];

    for (const key in affectedDimensions) {
      const deletionAction = affectedDimensions[key];
      let query = `DELETE FROM datasets.${deletionAction.datasetName} WHERE ${deletionAction.dimension} IN (`;
      query += deletionAction.affectedValues
        .map((key) => "'" + key + "'")
        .join(',');
      query += ');';
      console.log(query);
      queries.push(query);
    }

    // run these queries
    await this.prisma.$transaction(
      queries.map((query) => this.prisma.$executeRawUnsafe(query)),
    );

    return;
  }

  private async createUpdatedFileToIngest(
    ingestedFilePath: string,
    deletionFilePath: string,
    deltaFilePath?: string,
  ) {
    const ingestedData = (await readCSV(ingestedFilePath)).map((row) =>
      row.join(','),
    );
    const deletionData = (await readCSV(deletionFilePath))
      .map((row) => row.join(','))
      .slice(1);

    let newDataToIngest = ingestedData.filter(
      (row) => !deletionData.includes(row),
    );

    if (deltaFilePath) {
      const updateData = (await readCSV(deltaFilePath))
        .map((row) => row.join(','))
        .slice(1);
      newDataToIngest = newDataToIngest.concat(updateData);
    }

    // write this data to new file in the update folder
    const dataFileName = deletionFilePath
      .split('/')
      .pop()
      .replace('delete', 'data');
    const dataFilePath =
      deletionFilePath.split('/').slice(0, -1).join('/') + '/' + dataFileName;

    console.log('dataFilePath: ', dataFilePath);
    fs.writeFileSync(dataFilePath, newDataToIngest.join('\n'));

    await this.csvAdapterService.ingestData(
      {
        name: 'diksha_avg_play_time_in_mins_on_app_and_portal',
      },
      './update/programs',
    );
    return true;
  }

  private async processUpdateFile(
    updateFilePath: string,
    ingestedFilePath: string,
  ) {
    // this fn will take the ingested file, compare it with the update file and
    // create a new file which contains the data to be deleted and pass on the
    // three files to the fn `createUpdatedFileToIngest`

    const oldContent = (await readCSV(ingestedFilePath)).map((row) =>
      row.join(','),
    );
    const newContent = (await readCSV(updateFilePath)).map((row) =>
      row.join(','),
    );

    const toBeDeleted: string[] = [];
    const toBeInserted: string[] = [];

    // checking if the header is same
    if (oldContent[0] === newContent[0]) {
      // finding the diff between these two like git
      toBeDeleted.push(oldContent[0]);
      toBeInserted.push(newContent[0]);
      oldContent.forEach((row: string) => {
        // find this row in the new file and if not found add to toBeDeleted
        const idx = newContent.indexOf(row);
        if (idx > -1) {
          newContent.splice(idx, 1);
        } else {
          toBeDeleted.push(row);
        }
      });

      toBeInserted.push(...newContent);

      console.log('toBeDeleted: ', toBeDeleted);
      console.log('toBeInserted: ', toBeInserted);

      // write to files

      // create deletion file
      const deletionFilePath = updateFilePath.replace(
        'update.csv',
        'delete.csv',
      );
      fs.writeFileSync(deletionFilePath, toBeDeleted.join('\n'));

      // create delta file
      const deltaFilePath = updateFilePath.replace('update.csv', 'delta.csv');
      fs.writeFileSync(deltaFilePath, toBeInserted.join('\n'));

      await this.createUpdatedFileToIngest(
        ingestedFilePath,
        deletionFilePath,
        deltaFilePath,
      );
    } else {
      console.log('header is not same');
      console.log('newContent[0]: ', newContent[0]);
      console.log('oldContent[0]: ', oldContent[0]);
    }
  }
}
