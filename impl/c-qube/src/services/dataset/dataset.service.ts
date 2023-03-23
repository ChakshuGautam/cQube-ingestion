import { Injectable } from '@nestjs/common';
import {
  DatasetGrammar,
  DatasetUpdateRequest,
  DimensionMapping,
  TimeDimension,
} from '../../types/dataset';
import { DatasetGrammar as DatasetGrammarModel } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { QueryBuilderService } from '../query-builder/query-builder.service';
import { logToFile } from '../../utils/debug';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');

@Injectable()
export class DatasetService {
  constructor(
    public prisma: PrismaService,
    private qbService: QueryBuilderService,
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

  dbModelToDatasetGrammar(model: DatasetGrammarModel): DatasetGrammar {
    return {
      name: model.name,
      description: model.description,
      timeDimension: model.timeDimension as unknown as TimeDimension,
      dimensions: model.dimensions as unknown as DimensionMapping[],
      schema: model.schema as object,
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

    return this.prisma.datasetGrammar
      .create({
        data: {
          name: datasetGrammar.name,
          description: datasetGrammar.description,
          schema: datasetGrammar.schema,
          dimensions: JSON.stringify(datasetGrammar.dimensions),
          timeDimension: JSON.stringify(datasetGrammar.timeDimension),
        },
      })
      .then((model: DatasetGrammarModel) => this.dbModelToDatasetGrammar(model))
      .catch((error) => {
        // console.error(datasetGrammar.name);
        // console.error(JSON.stringify(datasetGrammar, null, 2));
        // console.error(error);
        // fs.writeFile(
        //   `./debug/datasetGrammar-${datasetGrammar.name}.error`,
        //   error.stack,
        //   function (err) {
        //     if (err) return console.log(err);
        //   },
        // );
        // throw error;
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
    durs[0].dataset.schema.properties = {
      ...durs[0].dataset.schema.properties,
      ...this.counterAggregates(),
      ...this.addNonTimeDimension(durs[0].dataset.dimensions[0]),
      ...this.addDateDimension(durs[0].dataset.timeDimension.key),
    };
    for (const dur of durs) {
      data.push({ ...dur.updateParams, ...dur.filterParams });
    }
    await this.insertBulkDatasetData(durs[0].dataset, data).catch((error) => {
      console.error('ERROR Inserting Data in Bulk: ', durs[0].dataset.name);
      console.error(data[0]);
      console.error(durs[0].dataset.schema.properties);
    });
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
