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
    }
    return {
      [key]: {
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
        throw error;
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
    timeDimensionKey = datasetGrammar.timeDimension.key;
    // Add aggregates to schema
    datasetGrammar.schema.properties = {
      ...datasetGrammar.schema.properties,
      ...this.counterAggregates(),
      ...this.addDateDimension(timeDimensionKey),
    };

    const createQuery = this.qbService.generateCreateStatement(
      datasetGrammar.schema,
      autoPrimaryKey,
    );
    const indexQuery: string[] = this.qbService.generateIndexStatement(
      datasetGrammar.schema,
    );
    await this.prisma.$queryRawUnsafe(createQuery).catch((error) => {
      console.error(datasetGrammar.schema.properties);
      console.error(error);
      console.error(createQuery);
    });

    // iterate over indexQuery and execute each query
    for (const query of indexQuery) {
      await this.prisma.$queryRawUnsafe(query);
    }
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
    await this.insertBulkDatasetData(durs[0].dataset, data);
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
