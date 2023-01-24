import { Injectable } from '@nestjs/common';
import { DatasetGrammar, DimensionMapping } from 'src/types/Dataset';
import { DatasetGrammar as DatasetGrammarModel } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { QueryBuilderService } from '../query-builder/query-builder.service';

@Injectable()
export class DatasetService {
  constructor(
    public prisma: PrismaService,
    private qbService: QueryBuilderService,
  ) {}

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
      .then((model: DatasetGrammarModel) =>
        this.dbModelToDatasetGrammar(model),
      );
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

  async createDataset(DatasetGrammar: DatasetGrammar): Promise<void> {
    const createQuery = this.qbService.generateCreateStatement(
      DatasetGrammar.schema,
    );
    const indexQuery: string[] = this.qbService.generateIndexStatement(
      DatasetGrammar.schema,
    );
    await this.prisma.$queryRawUnsafe(createQuery);

    // iterate over indexQuery and execute each query
    for (const query of indexQuery) {
      await this.prisma.$queryRawUnsafe(query);
    }
  }

  async insertDatasetData(DatasetGrammar: DatasetGrammar, data): Promise<void> {
    const insertQuery = this.qbService.generateInsertStatement(
      DatasetGrammar.schema,
      data,
    );
    await this.prisma.$queryRawUnsafe(insertQuery);
  }
}
