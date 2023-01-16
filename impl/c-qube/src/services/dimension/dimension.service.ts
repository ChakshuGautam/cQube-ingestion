import { Injectable } from '@nestjs/common';
import { DimensionGrammar, Store } from 'src/types/dimension';
import { DimensionGrammar as DimensionGrammarModel } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { QueryBuilderService } from '../query-builder/query-builder.service';

@Injectable()
export class DimensionService {
  constructor(
    public prisma: PrismaService,
    private qbService: QueryBuilderService,
  ) {}

  dbModelToDimensionGrammar(model: DimensionGrammarModel): DimensionGrammar {
    return {
      name: model.name,
      description: model.description,
      type: model.type,
      storage: model.storage as unknown as Store,
      schema: model.schema as object,
    };
  }

  async createDimensionGrammar(
    dimensionGrammar: DimensionGrammar,
  ): Promise<DimensionGrammar> {
    return this.prisma.dimensionGrammar
      .create({
        data: {
          name: dimensionGrammar.name,
          description: dimensionGrammar.description,
          type: dimensionGrammar.type,
          schema: dimensionGrammar.schema,
          storage: JSON.stringify(dimensionGrammar.storage),
        },
      })
      .then((model: DimensionGrammarModel) =>
        this.dbModelToDimensionGrammar(model),
      );
  }

  async getDimensionGrammar(
    dimensionId: number,
  ): Promise<DimensionGrammar | null> {
    return this.prisma.dimensionGrammar
      .findUnique({
        where: {
          id: dimensionId,
        },
      })
      .then((model: DimensionGrammarModel) =>
        this.dbModelToDimensionGrammar(model),
      );
  }

  async getDimensionGrammarByName(
    name: string,
  ): Promise<DimensionGrammar | null> {
    return this.prisma.dimensionGrammar
      .findFirst({
        where: {
          name: name,
        },
      })
      .then((model: DimensionGrammarModel) =>
        this.dbModelToDimensionGrammar(model),
      );
  }

  async createDimension(dimensionGrammar: DimensionGrammar): Promise<void> {
    const createQuery = this.qbService.generateCreateStatement(
      dimensionGrammar.schema,
    );
    const indexQuery: string[] = this.qbService.generateIndexStatement(
      dimensionGrammar.schema,
    );
    await this.prisma.$queryRawUnsafe(createQuery);

    // iterate over indexQuery and execute each query
    for (const query of indexQuery) {
      await this.prisma.$queryRawUnsafe(query);
    }
  }

  async insertDimensionData(
    dimensionGrammar: DimensionGrammar,
    data,
  ): Promise<void> {
    const insertQuery = this.qbService.generateInsertStatement(
      dimensionGrammar.schema,
      data,
    );
    await this.prisma.$queryRawUnsafe(insertQuery);
  }
}
