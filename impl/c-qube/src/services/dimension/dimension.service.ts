import { Injectable } from '@nestjs/common';
import { DimensionGrammar, Store } from 'src/types/dimension';
import { DimensionGrammar as DimensionGrammarModel } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { QueryBuilderService } from '../query-builder/query-builder.service';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// eslint-disable-next-line @typescript-eslint/no-var-requires
const _ = require('lodash');
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

  async getDimensionGrammaModelByName(
    name: string,
  ): Promise<DimensionGrammarModel | null> {
    return this.prisma.dimensionGrammar.findFirst({
      where: {
        name: name,
      },
    });
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

  async createDimension(
    dimensionGrammar: DimensionGrammar,
    autoPrimaryKey = true,
  ): Promise<void> {
    const createQuery = this.qbService.generateCreateStatement(
      dimensionGrammar.schema,
      autoPrimaryKey,
    );
    const indexQuery: string[] = this.qbService.generateIndexStatement(
      dimensionGrammar.schema,
    );
    await this.prisma.$queryRawUnsafe(createQuery).catch((e) => {
      console.error(dimensionGrammar.name);
      console.error(JSON.stringify(dimensionGrammar, null, 2));
      console.error({ createQuery });
      console.error({ indexQuery });
    });

    // iterate over indexQuery and execute each query
    for (const query of indexQuery) {
      await this.prisma.$queryRawUnsafe(query).catch((e) => {
        console.error(dimensionGrammar.name);
        console.error(query);
        console.error(e);
      });
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

  async insertBulkDimensionData(
    dimensionGrammar: DimensionGrammar,
    data: any[],
  ): Promise<void> {
    data = data.map((item) => {
      return {
        name: item.name.replace(/\s+\)/g, ')'),
        id: item.id,
      };
    });
    data = _.uniqBy(data, 'name');

    const insertQuery = this.qbService.generateBulkInsertStatementOld(
      dimensionGrammar.schema,
      data,
    );

    await this.prisma.$queryRawUnsafe(insertQuery).catch(async (err) => {
      console.log('After', dimensionGrammar.name, data.length);
      if (data.length < 50) {
        console.log(data);
      }
      // save data to CSV
      // const csvWriter = createCsvWriter({
      //   path: `fixtures/${dimensionGrammar.name}.csv`,
      //   header: [
      //     { id: 'name', title: 'name' },
      //     { id: 'id', title: 'id' },
      //   ],
      // });
      // await csvWriter.writeRecords(data).then(() => {
      //   console.log('...Done');
      // });

      console.error(dimensionGrammar.name);
      console.error(err);
    });
  }

  async insertBulkDimensionDataV2(
    dimensionGrammar: DimensionGrammar,
    data: any[],
  ): Promise<void> {
    // console.log('data in insertBulkDimensionDataV2: ', data.length);
    const insertQuery = this.qbService.generateBulkInsertStatementOld(
      dimensionGrammar.schema,
      data,
    );

    // console.log('dimensionGrammar: ', dimensionGrammar.schema);

    await this.prisma.$queryRawUnsafe(insertQuery).catch(async (err) => {
      console.log('After', dimensionGrammar.name, data.length);
      console.error(insertQuery);
      if (data.length < 50) {
        console.log(data);
      }
      console.error(dimensionGrammar.name);
      console.error(err);
    });
  }
}
