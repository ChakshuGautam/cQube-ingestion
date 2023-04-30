import { Injectable } from '@nestjs/common';
import {
  DatasetGrammar,
  DatasetUpdateRequest,
  DimensionMapping,
  TimeDimension,
} from '../../types/dataset';
import {
  DatasetGrammar as DatasetGrammarModel,
  EventGrammar as EventGrammarModel,
} from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { QueryBuilderService } from '../query-builder/query-builder.service';
import { logToFile } from '../../utils/debug';
import { EventService } from '../event/event.service';
import { EventGrammar } from 'src/types/event';
const pLimit = require('p-limit');
const limit = pLimit(20);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');

@Injectable()
export class DatasetService {
  constructor(
    public prisma: PrismaService,
    private qbService: QueryBuilderService,
    private eventGrammarService: EventService,
  ) {}

  counterAggregates(): any {
    return {
      count: { type: 'number', format: 'float' },
      sum: { type: 'number', format: 'float' },
      avg: { type: 'number', format: 'float' },
    };
  }

  addDateDimension(key): any {
    if (key === 'date') {
      return {
        [key]: {
          type: 'string',
          format: 'date',
        },
      };
    } else if (key === 'year') {
      return {
        [key]: {
          type: 'integer',
        },
      };
    }
    return {
      [key]: {
        type: 'integer',
      },
      year: {
        type: 'integer',
      },
    };
  }

  async dbModelToDatasetGrammar(
    model: DatasetGrammarModel,
  ): Promise<DatasetGrammar> {
    let eventGrammar: EventGrammar;
    if (model.eventGrammarId) {
      const eventGrammarModel: EventGrammarModel =
        await this.prisma.eventGrammar.findUnique({
          where: {
            id: model.eventGrammarId,
          },
        });
      eventGrammar = (await this.eventGrammarService.dbModelToEventGrammar(
        eventGrammarModel,
      )) as EventGrammar;
    }
    return {
      name: model.name,
      description: model.description,
      timeDimension: JSON.parse(model.timeDimension as string) as TimeDimension,
      dimensions: JSON.parse(model.dimensions as string) as DimensionMapping[],
      schema: model.schema as object,
      isCompound: model.isCompound,
      eventGrammarFile: model.eventGrammarFile,
      eventGrammar: eventGrammar,
    };
  }

  async createDatasetGrammar(
    datasetGrammar: DatasetGrammar,
  ): Promise<DatasetGrammar> {
    // save this to datasetGrammar.json
    logToFile(
      datasetGrammar,
      `datasetGrammar-${datasetGrammar.name}_${new Date().valueOf()}.json`,
    );

    let eventGrammar: EventGrammarModel;
    if (datasetGrammar.eventGrammar) {
      eventGrammar = await this.prisma.eventGrammar.findUnique({
        where: {
          name: datasetGrammar.eventGrammar.name,
        },
      });
    }

    return this.prisma.datasetGrammar
      .create({
        data: {
          name: datasetGrammar.name,
          description: datasetGrammar.description,
          schema: datasetGrammar.schema,
          dimensions: JSON.stringify(datasetGrammar.dimensions),
          timeDimension: JSON.stringify(datasetGrammar.timeDimension),
          isCompound: datasetGrammar.isCompound || false,
          program: datasetGrammar.program,
          eventGrammarFile: datasetGrammar.eventGrammarFile,
          eventGrammarId: eventGrammar?.id,
        },
      })
      .then((model: DatasetGrammarModel) => {
        // console.log('Dataset Grammar created successfully', model.name);
        return this.dbModelToDatasetGrammar(model);
      })
      .catch((error) => {
        console.error(datasetGrammar.name);
        console.error(JSON.stringify(datasetGrammar, null, 2));
        console.error(error);
        fs.writeFile(
          `./debug/datasetGrammar-${datasetGrammar.name}.error`,
          error.stack,
          function (err) {
            if (err) return console.log(err);
          },
        );
        throw error;
        return datasetGrammar;
      });
  }

  async getDatasetGrammar(datasetId: number): Promise<DatasetGrammar | null> {
    return this.prisma.datasetGrammar
      .findUnique({
        where: {
          id: datasetId,
        },
      })
      .then((model: DatasetGrammarModel) =>
        this.dbModelToDatasetGrammar(model),
      );
  }

  async getDatasetGrammarByName(name: string): Promise<DatasetGrammar | null> {
    return this.prisma.datasetGrammar
      .findFirst({
        where: {
          name: name,
        },
      })
      .then((model: DatasetGrammarModel) =>
        this.dbModelToDatasetGrammar(model),
      );
  }

  async getCompoundDatasetGrammars(): Promise<DatasetGrammar[]> {
    return this.prisma.datasetGrammar
      .findMany({
        where: {
          isCompound: true,
        },
      })
      .then(
        async (models: DatasetGrammarModel[]): Promise<DatasetGrammar[]> => {
          const data = Promise.all(
            models.map((model) => this.dbModelToDatasetGrammar(model)),
          );
          return data;
        },
      );
  }

  async getNonCompoundDatasetGrammars(): Promise<DatasetGrammar[]> {
    return this.prisma.datasetGrammar
      .findMany({
        where: {
          isCompound: false,
        },
      })
      .then(
        async (models: DatasetGrammarModel[]): Promise<DatasetGrammar[]> => {
          const data = Promise.all(
            models.map((model) => this.dbModelToDatasetGrammar(model)),
          );
          return data;
        },
      );
  }

  async createDataset(
    datasetGrammar: DatasetGrammar,
    autoPrimaryKey = true,
  ): Promise<void> {
    // add FK params to schema
    let timeDimensionKey = 'date';
    if (datasetGrammar.dimensions.length > 0) {
      datasetGrammar.schema['fk'] = [];
      for (const dimension of datasetGrammar.dimensions) {
        datasetGrammar.schema['fk'].push({
          column: dimension.key,
          reference: {
            table: `dimensions.${dimension.dimension.name.name}`,
            column: dimension.dimension.mapped_to,
          },
        });
      }
    }
    // Add aggregates to schema
    if (datasetGrammar.timeDimension) {
      timeDimensionKey = datasetGrammar.timeDimension.key;

      datasetGrammar.schema.properties = {
        ...datasetGrammar.schema.properties,
        ...this.counterAggregates(),
        ...this.addDateDimension(timeDimensionKey),
      };
    } else {
      datasetGrammar.schema.properties = {
        ...datasetGrammar.schema.properties,
        ...this.counterAggregates(),
      };
    }

    const createQuery = this.qbService.generateCreateStatement(
      datasetGrammar.schema,
      autoPrimaryKey,
    );
    const indexQuery: string[] = this.qbService.generateIndexStatement(
      datasetGrammar.schema,
    );
    // console.error(datasetGrammar.name, { createQuery, indexQuery });
    await this.prisma
      .$queryRawUnsafe(createQuery)
      .catch(async (error) => {
        // console.error(datasetGrammar.schema.properties);
        console.error(
          'ERROR',
          createQuery,
          indexQuery,
          datasetGrammar.name,
          datasetGrammar.schema.fk,
          error,
        );
        // delete datasetGrammar.schema.fk;
        // const createQuery = this.qbService.generateCreateStatement(
        //   datasetGrammar.schema,
        //   autoPrimaryKey,
        // );
        // console.log('Query2', createQuery);
        // await this.prisma.$queryRawUnsafe(createQuery).catch((e) => {
        //   console.error('Failed again');
        // });
      })
      .then(async (model: DatasetGrammarModel) => {
        // iterate over indexQuery and execute each query
        for (const query of indexQuery) {
          await this.prisma.$queryRawUnsafe(query);
        }
      });
  }

  async insertDatasetData(datasetGrammar: DatasetGrammar, data): Promise<void> {
    const insertQuery = this.qbService.generateInsertStatement(
      datasetGrammar.schema,
      data,
    );
    await this.prisma.$queryRawUnsafe(insertQuery);
  }

  async insertBulkDatasetData(
    datasetGrammar: DatasetGrammar,
    data: any[],
  ): Promise<void> {
    const insertQuery = this.qbService.generateBulkInsertStatement(
      datasetGrammar.schema,
      data,
    );
    await this.prisma.$queryRawUnsafe(insertQuery);
  }

  async processDatasetUpdateRequest(
    durs: DatasetUpdateRequest[],
  ): Promise<void> {
    const data = [];
    const timeDimensionProperties = durs[0].dataset.timeDimension
      ? this.addDateDimension(durs[0].dataset.timeDimension.key)
      : [];
    durs[0].dataset.schema.properties = {
      ...durs[0].dataset.schema.properties,
      ...this.counterAggregates(),
      ...this.addNonTimeDimension(durs[0].dataset.dimensions[0]),
      ...timeDimensionProperties,
    };
    for (const dur of durs) {
      data.push({ ...dur.updateParams, ...dur.filterParams });
    }
    // TODO check for FK constraints before insert
    await this.insertBulkDatasetData(durs[0].dataset, data).catch(
      async (error) => {
        console.error('ERROR Inserting Data in Bulk: ', durs[0].dataset.name);
        console.error('Trying them 1 by 1');
        // start ingesting one by one and print row if cannot be ingested
        let rowsIngested = 0;
        const failedRows = [];
        const promises = data.map((row) => {
          return limit(() => this.insertDatasetData(durs[0].dataset, row))
            .then((s) => {
              rowsIngested += 1;
              console.log('Done', rowsIngested);
            })
            .catch((e) => {
              console.error(
                `Could not insert data due to FK constraint ${durs[0].dataset.name}`,
                row,
              );
              failedRows.push(row);
            });
        });
        const result = await Promise.all(promises);
        console.error(result.length, 'rows inserted');
      },
    );
  }
  addNonTimeDimension(dimension: DimensionMapping): {
    [k: string]: any;
  } {
    return {
      [dimension.key]: {
        type: 'string',
      },
    };
  }
}
