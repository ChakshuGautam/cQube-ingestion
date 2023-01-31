import { Injectable } from '@nestjs/common';
import { DatasetGrammar, DimensionMapping } from '../../types/dataset';
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
    return {
      [key]: {
        type: 'string',
        format: 'date',
      },
    };
  }

  dbModelToDatasetGrammar(model: DatasetGrammarModel): DatasetGrammar {
    return {
      name: model.name,
      description: model.description,
      dimensions: model.dimensions as unknown as DimensionMapping[],
      schema: model.schema as object,
    };
  }

  async createDatasetGrammar(
    DatasetGrammar: DatasetGrammar,
  ): Promise<DatasetGrammar> {
    return this.prisma.datasetGrammar
      .create({
        data: {
          name: DatasetGrammar.name,
          description: DatasetGrammar.description,
          schema: DatasetGrammar.schema,
          dimensions: JSON.stringify(DatasetGrammar.dimensions),
        },
      })
      .then((model: DatasetGrammarModel) => this.dbModelToDatasetGrammar(model))
      .catch((error) => {
        throw error;
      });
  }

  async getDatasetGrammar(DatasetId: number): Promise<DatasetGrammar | null> {
    return this.prisma.datasetGrammar
      .findUnique({
        where: {
          id: DatasetId,
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
    datasetGrammar.schema.properties = {
      ...datasetGrammar.schema.properties,
      ...this.counterAggregates(),
      ...this.addDateDimension('date'),
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
}
