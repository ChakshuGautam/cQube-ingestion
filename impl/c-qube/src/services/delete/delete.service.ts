import { Injectable, Logger } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { readCSV } from '../csv-adapter/parser/utils/csvreader';
import * as fs from 'fs';
import { PrismaService } from '../../prisma.service';
import { CsvAdapterService } from '../csv-adapter/csv-adapter.service';
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
  ) {}

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
